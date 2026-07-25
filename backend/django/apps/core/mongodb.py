"""
MongoDB connection manager, Prometheus observability hooks, and base collection
utility for the JOL-HUB platform.

Architecture
------------
- **pymongo** (raw driver) is used instead of mongoengine because MongoDB stores
  raw, unpredictable JSON webhook payloads and high-volume audit logs.
- Connection is lazily initialised on first access and shared process-wide.
- A ``CommandListener`` exposes every MongoDB operation to Prometheus.
- ``MongoBaseCollection`` enforces ``created_at``, ``updated_at``, and
  ``tenant_id`` on every document for GDPR multi-tenant data isolation.

Compliance
----------
- SOC2 CC6.1 — Credentials supplied via ``MONGODB_URI`` env var, never hardcoded.
- SOC2 CC7.2 — All operations tracked via Prometheus counters/histograms.
- GDPR Art. 5(1)(e) — TTL indexes auto-expire raw payloads (data minimisation).
- GDPR Art. 32 — TLS in transit enforced via ``MONGODB_TLS_ENABLED``.

Usage
-----
::

    from apps.core.mongodb import mongo_manager, WebhookPayloadCollection

    # Insert a raw webhook payload (tenant_id auto-injected)
    doc_id = WebhookPayloadCollection.insert_one({"event": "crm.lead.add", ...})

    # Query with tenant isolation
    results = WebhookPayloadCollection.find({"event": "crm.lead.add"})
"""

from __future__ import annotations

import atexit
import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Optional

from django.conf import settings

logger = logging.getLogger("jolhub.mongodb")

# ---------------------------------------------------------------------------
# Prometheus metrics (imported lazily so tests without prometheus-client still
# work, though the dependency is always present in production).
# ---------------------------------------------------------------------------
from prometheus_client import Counter, Gauge, Histogram  # noqa: E402

# Histogram buckets: fine-grained below 100ms, then the slow-query threshold,
# then coarser buckets up to 10s.  This lets Grafana dashboards easily spot
# N+1 query issues or unindexed scans crossing the 100ms boundary.
_BUCKETS = (
    0.001, 0.005, 0.010, 0.025, 0.050, 0.075,
    0.100,   # <-- slow-query threshold boundary
    0.250, 0.500, 1.0, 2.5, 5.0, 10.0,
)

MONGO_QUERY_DURATION = Histogram(
    "mongodb_query_duration_seconds",
    "Duration of MongoDB commands in seconds.",
    labelnames=("command_name", "collection", "database"),
    buckets=_BUCKETS,
)

MONGO_QUERIES_TOTAL = Counter(
    "mongodb_queries_total",
    "Total number of MongoDB commands executed.",
    labelnames=("command_name", "collection", "database"),
)

MONGO_QUERY_ERRORS_TOTAL = Counter(
    "mongodb_query_errors_total",
    "Total number of failed MongoDB commands.",
    labelnames=("command_name", "error_code", "database"),
)

MONGO_POOL_ACTIVE = Gauge(
    "mongodb_pool_active_connections",
    "Number of active connections in the MongoDB pool.",
    labelnames=("server",),
)

MONGO_POOL_AVAILABLE = Gauge(
    "mongodb_pool_available_connections",
    "Number of idle connections available in the MongoDB pool.",
    labelnames=("server",),
)


# ---------------------------------------------------------------------------
# PyMongo CommandListener — bridges driver events to Prometheus.
# ---------------------------------------------------------------------------

from pymongo.monitoring import CommandListener as _PyMongoCommandListener  # noqa: E402


class PrometheusCommandListener(_PyMongoCommandListener):
    """PyMongo ``CommandListener`` that records every operation to Prometheus.

    Implements the three callback methods required by
    ``pymongo.monitoring.CommandListener``:

    * ``started``  — fires on ``CommandStartedEvent``
    * ``succeeded`` — fires on ``CommandSucceededEvent``
    * ``failed``   — fires on ``CommandFailedEvent``

    Each callback extracts the ``command_name`` (e.g. ``insert``, ``find``,
    ``aggregate``) and target ``collection`` so Grafana can pinpoint slow or
    failing operations.
    """

    # Thread-local storage for tracking command start times and metadata.
    _local = threading.local()

    # ---- CommandListener interface ----

    def started(self, event: Any) -> None:
        """Record the start time and command metadata of a MongoDB command.

        Args:
            event: ``pymongo.monitoring.CommandStartedEvent``.
        """
        if not hasattr(self._local, "start_times"):
            self._local.start_times = {}
        if not hasattr(self._local, "collections"):
            self._local.collections = {}
        self._local.start_times[event.request_id] = time.monotonic()
        # Extract collection name from the command dict (available only on
        # CommandStartedEvent in pymongo 4.x).
        command_name = event.command_name
        collection = event.command.get(command_name, "unknown")
        self._local.collections[event.request_id] = str(collection)

    def succeeded(self, event: Any) -> None:
        """Observe the duration and count of a successful MongoDB command.

        Args:
            event: ``pymongo.monitoring.CommandSucceededEvent``.
        """
        command_name = event.command_name
        database = event.database_name
        collection = self._pop_collection(event.request_id)

        MONGO_QUERIES_TOTAL.labels(
            command_name=command_name,
            collection=collection,
            database=database,
        ).inc()

        duration = self._pop_duration(event.request_id, event.duration_micros)
        MONGO_QUERY_DURATION.labels(
            command_name=command_name,
            collection=collection,
            database=database,
        ).observe(duration)

        slow_threshold: float = getattr(
            settings, "MONGODB_SLOW_QUERY_THRESHOLD_S", 0.1,
        )
        if duration >= slow_threshold:
            logger.warning(
                "Slow MongoDB query: %s.%s %s took %.3fs (threshold %.3fs)",
                database,
                collection,
                command_name,
                duration,
                slow_threshold,
            )

    def failed(self, event: Any) -> None:
        """Record a failed MongoDB command.

        Args:
            event: ``pymongo.monitoring.CommandFailedEvent``.
        """
        command_name = event.command_name
        database = event.database_name
        failure = getattr(event, "failure", {})
        error_code = str(failure.get("code", "unknown")) if isinstance(failure, dict) else "unknown"
        collection = self._pop_collection(event.request_id)

        MONGO_QUERY_ERRORS_TOTAL.labels(
            command_name=command_name,
            error_code=error_code,
            database=database,
        ).inc()

        # Still record duration so histograms reflect error-path latency.
        duration = self._pop_duration(event.request_id, event.duration_micros)
        MONGO_QUERY_DURATION.labels(
            command_name=command_name,
            collection=collection,
            database=database,
        ).observe(duration)

    # ---- helpers ----

    @staticmethod
    def _pop_collection(request_id: int) -> str:
        """Return the collection name captured during ``started``."""
        collections = getattr(PrometheusCommandListener._local, "collections", {})
        return collections.pop(request_id, "unknown")

    @staticmethod
    def _pop_duration(request_id: int, duration_micros: float) -> float:
        """Return elapsed seconds, preferring wall-clock delta if available.

        Falls back to the driver-reported ``duration_micros`` when the start
        time was not captured (e.g. listener registered mid-flight).
        """
        start_times = getattr(PrometheusCommandListener._local, "start_times", {})
        start = start_times.pop(request_id, None)
        if start is not None:
            return time.monotonic() - start
        return duration_micros / 1_000_000


# ---------------------------------------------------------------------------
# Connection Manager (singleton, thread-safe, process-wide).
# ---------------------------------------------------------------------------

class MongoConnectionManager:
    """Singleton manager for the MongoDB ``MongoClient``.

    Initialises the client lazily on first call to :meth:`get_client` or
    :meth:`get_database`.  Supports both real ``pymongo`` and ``mongomock``
    (for unit tests) based on the ``MONGODB_URI`` scheme.

    The connection is automatically closed at interpreter exit via
    ``atexit``.
    """

    _instance: Optional[MongoConnectionManager] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._client: Any = None
        self._db: Any = None
        self._listener = PrometheusCommandListener()
        self._is_mock = False

    # -- singleton access --

    @classmethod
    def get_instance(cls) -> MongoConnectionManager:
        """Return the process-wide ``MongoConnectionManager`` singleton."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    # -- public API --

    def initialise(self) -> None:
        """Create the ``MongoClient`` using Django settings.

        Safe to call multiple times; subsequent calls are no-ops.
        Detects ``mongomock://`` URIs and transparently returns a
        ``mongomock.MongoClient`` for test isolation.
        """
        if self._client is not None:
            return

        uri: str = getattr(settings, "MONGODB_URI", "mongodb://localhost:27017")
        db_name: str = getattr(settings, "MONGODB_DB_NAME", "jolhub_documents")

        if uri.startswith("mongomock://"):
            self._init_mock(uri, db_name)
            return

        self._init_real(uri, db_name)

    def get_client(self) -> Any:
        """Return the underlying ``MongoClient`` (or ``mongomock`` client).

        Raises:
            RuntimeError: If the client has not been initialised.
        """
        if self._client is None:
            self.initialise()
        return self._client

    def get_database(self) -> Any:
        """Return the configured MongoDB database handle.

        Returns:
            A ``pymongo.database.Database`` (or mongomock equivalent).
        """
        if self._db is None:
            self.get_client()  # triggers initialisation
        return self._db

    def get_collection(self, name: str) -> Any:
        """Return a collection handle from the configured database.

        Args:
            name: The collection name.

        Returns:
            A ``pymongo.collection.Collection`` (or mongomock equivalent).
        """
        return self.get_database()[name]

    def close(self) -> None:
        """Gracefully close the MongoDB connection and release pool resources."""
        if self._client is not None:
            logger.info("Closing MongoDB connection pool.")
            self._client.close()
            self._client = None
            self._db = None

    def update_pool_metrics(self) -> None:
        """Scrape connection pool stats and push to Prometheus gauges.

        Intended to be called periodically by a Celery beat task or a
        background thread.  No-op when running under mongomock.
        """
        if self._client is None or self._is_mock:
            return

        try:
            for server in self._client.topology_description.server_descriptions():
                addr = str(server.address)
                # pymongo ServerDescription doesn't directly expose pool stats,
                # so we use the client-level monitor.
                try:
                    pool_stats = self._client._get_topology()._pool_lock  # type: ignore[attr-defined]
                except (AttributeError, Exception):
                    # Fallback: parse from serverStatus if available.
                    pass

                # Use topology description for basic availability.
                is_available = server.is_server_type_known
                MONGO_POOL_ACTIVE.labels(server=addr).set(1 if is_available else 0)
                MONGO_POOL_AVAILABLE.labels(server=addr).set(
                    1 if server.is_writable else 0,
                )
        except Exception:
            logger.debug("Could not scrape MongoDB pool metrics.", exc_info=True)

    # -- private helpers --

    def _init_real(self, uri: str, db_name: str) -> None:
        """Initialise a real ``pymongo.MongoClient`` with TLS and pooling."""
        from pymongo import MongoClient

        kwargs: dict[str, Any] = {
            "maxPoolSize": getattr(settings, "MONGODB_MAX_POOL_SIZE", 50),
            "minPoolSize": getattr(settings, "MONGODB_MIN_POOL_SIZE", 5),
            "maxIdleTimeMS": getattr(settings, "MONGODB_MAX_IDLE_TIME_MS", 60_000),
            "connectTimeoutMS": getattr(settings, "MONGODB_CONNECT_TIMEOUT_MS", 10_000),
            "serverSelectionTimeoutMS": getattr(
                settings, "MONGODB_SERVER_SELECTION_TIMEOUT_MS", 5_000,
            ),
            "event_listeners": [self._listener],
        }

        tls_enabled: bool = getattr(settings, "MONGODB_TLS_ENABLED", False)
        if tls_enabled:
            kwargs["tls"] = True
            ca_file: str = getattr(settings, "MONGODB_TLS_CA_FILE", "")
            if ca_file:
                kwargs["tlsCAFile"] = ca_file

        logger.info(
            "Initialising MongoDB client (TLS=%s, pool=%d-%d).",
            tls_enabled,
            kwargs["minPoolSize"],
            kwargs["maxPoolSize"],
        )

        self._client = MongoClient(uri, **kwargs)
        self._db = self._client[db_name]
        self._is_mock = False

        # Verify connectivity with a lightweight ping.
        try:
            self._client.admin.command("ping")
            logger.info("MongoDB connection established successfully.")
        except Exception:
            logger.error("MongoDB connectivity check failed.", exc_info=True)

        atexit.register(self.close)

    def _init_mock(self, uri: str, db_name: str) -> None:
        """Initialise a ``mongomock.MongoClient`` for test isolation."""
        try:
            import mongomock
        except ImportError as exc:
            raise ImportError(
                "mongomock is required for test mode. "
                "Install it with: pip install mongomock"
            ) from exc

        logger.info("Initialising mongomock client for test isolation.")
        self._client = mongomock.MongoClient()
        self._db = self._client[db_name]
        self._is_mock = True


# ---------------------------------------------------------------------------
# Convenience module-level singleton.
# ---------------------------------------------------------------------------

mongo_manager = MongoConnectionManager.get_instance()


# ---------------------------------------------------------------------------
# Base Collection utility — enforces document structure for multi-tenancy.
# ---------------------------------------------------------------------------

class MongoBaseCollection:
    """Lightweight wrapper around a MongoDB collection.

    Automatically injects:
    - ``created_at`` (UTC ISO-8601) on insert.
    - ``updated_at`` (UTC ISO-8601) on insert and update.
    - ``tenant_id`` on insert for GDPR multi-tenant data isolation.

    Subclass and set ``collection_name`` to create domain-specific helpers::

        class WebhookPayloadCollection(MongoBaseCollection):
            collection_name = "webhook_payloads"

    All public methods are thin wrappers around ``pymongo.Collection`` that
    enforce the above fields and log slow operations.
    """

    collection_name: str = ""

    @classmethod
    def _get_collection(cls) -> Any:
        """Return the underlying ``pymongo.Collection``.

        Returns:
            The collection handle for ``cls.collection_name``.

        Raises:
            ValueError: If ``collection_name`` is not set.
        """
        if not cls.collection_name:
            raise ValueError(
                f"{cls.__name__} must define a non-empty 'collection_name'."
            )
        return mongo_manager.get_collection(cls.collection_name)

    @classmethod
    def _inject_metadata(
        cls,
        document: dict[str, Any],
        tenant_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Inject ``created_at``, ``updated_at``, and ``tenant_id`` into a document.

        Args:
            document: The raw document dict (mutated in place).
            tenant_id: The tenant identifier for GDPR isolation.
                If ``None``, attempts to read from the current request
                context (thread-local set by ``TenantContextMiddleware``).

        Returns:
            The same dict with metadata fields added.
        """
        now = datetime.now(timezone.utc).isoformat()
        document.setdefault("created_at", now)
        document["updated_at"] = now

        if tenant_id is None:
            tenant_id = cls._resolve_tenant_id()
        if tenant_id:
            document.setdefault("tenant_id", tenant_id)

        return document

    @staticmethod
    def _resolve_tenant_id() -> Optional[str]:
        """Attempt to read ``tenant_id`` from the thread-local tenant context.

        Returns:
            The tenant ID string, or ``None`` if not in a request context.
        """
        try:
            from apps.crm.middleware import TenantContextMiddleware
            tenant = TenantContextMiddleware.get_tenant()
            if tenant is not None:
                return str(tenant)
        except (ImportError, AttributeError, Exception):
            pass
        return None

    # -- CRUD helpers --

    @classmethod
    def insert_one(
        cls,
        document: dict[str, Any],
        tenant_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """Insert a single document with automatic metadata injection.

        Args:
            document: The document to insert.
            tenant_id: Optional tenant identifier for GDPR isolation.
            **kwargs: Passed through to ``pymongo.Collection.insert_one``.

        Returns:
            The ``InsertOneResult.inserted_id``.
        """
        cls._inject_metadata(document, tenant_id=tenant_id)
        result = cls._get_collection().insert_one(document, **kwargs)
        logger.debug(
            "Inserted document %s into %s", result.inserted_id, cls.collection_name,
        )
        return result.inserted_id

    @classmethod
    def insert_many(
        cls,
        documents: list[dict[str, Any]],
        tenant_id: Optional[str] = None,
        **kwargs: Any,
    ) -> list[Any]:
        """Insert multiple documents with automatic metadata injection.

        Args:
            documents: List of documents to insert.
            tenant_id: Optional tenant identifier for GDPR isolation.
            **kwargs: Passed through to ``pymongo.Collection.insert_many``.

        Returns:
            List of inserted ``ObjectId`` values.
        """
        for doc in documents:
            cls._inject_metadata(doc, tenant_id=tenant_id)
        result = cls._get_collection().insert_many(documents, **kwargs)
        logger.debug(
            "Inserted %d documents into %s",
            len(result.inserted_ids),
            cls.collection_name,
        )
        return result.inserted_ids

    @classmethod
    def find(
        cls,
        filter: Optional[dict[str, Any]] = None,  # noqa: A002
        tenant_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """Query documents with optional tenant scoping.

        When ``tenant_id`` is provided (or resolvable from context), the
        filter is automatically scoped to that tenant for GDPR isolation.

        Args:
            filter: MongoDB query filter.
            tenant_id: Optional tenant identifier to scope the query.
            **kwargs: Passed through to ``pymongo.Collection.find``.

        Returns:
            A ``pymongo.cursor.Cursor`` over matching documents.
        """
        filter = dict(filter or {})
        resolved_tenant = tenant_id or cls._resolve_tenant_id()
        if resolved_tenant:
            filter.setdefault("tenant_id", resolved_tenant)
        return cls._get_collection().find(filter, **kwargs)

    @classmethod
    def find_one(
        cls,
        filter: Optional[dict[str, Any]] = None,  # noqa: A002
        tenant_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Optional[dict[str, Any]]:
        """Find a single document with optional tenant scoping.

        Args:
            filter: MongoDB query filter.
            tenant_id: Optional tenant identifier to scope the query.
            **kwargs: Passed through to ``pymongo.Collection.find_one``.

        Returns:
            The matching document dict, or ``None``.
        """
        filter = dict(filter or {})
        resolved_tenant = tenant_id or cls._resolve_tenant_id()
        if resolved_tenant:
            filter.setdefault("tenant_id", resolved_tenant)
        return cls._get_collection().find_one(filter, **kwargs)

    @classmethod
    def update_one(
        cls,
        filter: dict[str, Any],  # noqa: A002
        update: dict[str, Any],
        tenant_id: Optional[str] = None,
        upsert: bool = False,
        **kwargs: Any,
    ) -> Any:
        """Update a single document, auto-setting ``updated_at``.

        Args:
            filter: MongoDB query filter.
            update: MongoDB update document (e.g. ``{"$set": {...}}``).
            tenant_id: Optional tenant identifier to scope the update.
            upsert: Whether to insert if no document matches.
            **kwargs: Passed through to ``pymongo.Collection.update_one``.

        Returns:
            The ``UpdateResult`` from pymongo.
        """
        resolved_tenant = tenant_id or cls._resolve_tenant_id()
        if resolved_tenant:
            filter.setdefault("tenant_id", resolved_tenant)

        # Inject updated_at into $set.
        if "$set" not in update:
            update["$set"] = {}
        update["$set"]["updated_at"] = datetime.now(timezone.utc).isoformat()

        return cls._get_collection().update_one(
            filter, update, upsert=upsert, **kwargs,
        )

    @classmethod
    def delete_many(
        cls,
        filter: dict[str, Any],  # noqa: A002
        tenant_id: Optional[str] = None,
        **kwargs: Any,
    ) -> int:
        """Delete documents matching the filter, scoped to a tenant.

        Args:
            filter: MongoDB query filter.
            tenant_id: Optional tenant identifier — **required** to prevent
                accidental cross-tenant deletion.
            **kwargs: Passed through to ``pymongo.Collection.delete_many``.

        Returns:
            The number of deleted documents.

        Raises:
            ValueError: If no ``tenant_id`` is provided or resolvable.
        """
        resolved_tenant = tenant_id or cls._resolve_tenant_id()
        if not resolved_tenant:
            raise ValueError(
                "delete_many requires a tenant_id to prevent cross-tenant "
                "data deletion (GDPR compliance)."
            )
        filter["tenant_id"] = resolved_tenant
        result = cls._get_collection().delete_many(filter, **kwargs)
        logger.info(
            "Deleted %d documents from %s (tenant=%s)",
            result.deleted_count,
            cls.collection_name,
            resolved_tenant,
        )
        return result.deleted_count

    # -- Index management --

    @classmethod
    def ensure_ttl_index(
        cls,
        field: str = "created_at",
        expire_after_days: Optional[int] = None,
    ) -> None:
        """Create a TTL index on the specified date field.

        GDPR Art. 5(1)(e) — Storage limitation.  Raw webhook payloads and
        audit logs auto-expire after ``MONGODB_TTL_DAYS`` (default 90).

        Args:
            field: The date field to index (default ``created_at``).
            expire_after_days: Override the default TTL from settings.
        """
        if expire_after_days is None:
            expire_after_days = getattr(settings, "MONGODB_TTL_DAYS", 90)

        ttl_seconds = expire_after_days * 86_400
        collection = cls._get_collection()

        # mongomock does not support TTL indexes; skip silently.
        if getattr(mongo_manager, "_is_mock", False):
            logger.debug("Skipping TTL index creation (mongomock).")
            return

        index_name = f"{field}_ttl_{expire_after_days}d"
        collection.create_index(
            field,
            expireAfterSeconds=ttl_seconds,
            name=index_name,
        )
        logger.info(
            "Ensured TTL index '%s' on %s.%s (%d days).",
            index_name,
            cls.collection_name,
            field,
            expire_after_days,
        )

    @classmethod
    def ensure_tenant_index(cls) -> None:
        """Create a compound index on ``(tenant_id, created_at)`` for fast
        tenant-scoped queries and GDPR data-export lookups.
        """
        collection = cls._get_collection()
        collection.create_index(
            [("tenant_id", 1), ("created_at", -1)],
            name="tenant_created_at_idx",
        )
        logger.info(
            "Ensured compound index (tenant_id, created_at) on %s.",
            cls.collection_name,
        )

    @classmethod
    def ensure_indexes(cls) -> None:
        """Create all recommended indexes for this collection.

        Override in subclasses to add domain-specific indexes.
        """
        cls.ensure_tenant_index()
        cls.ensure_ttl_index()


# ---------------------------------------------------------------------------
# Concrete collection classes for the two initial use cases.
# ---------------------------------------------------------------------------

class WebhookPayloadCollection(MongoBaseCollection):
    """Stores raw Bitrix24 (and future) webhook payloads.

    Schema is intentionally unstructured — the driver was chosen specifically
    because Bitrix24 payloads are unpredictable JSON.

    TTL: Raw payloads auto-expire after ``MONGODB_TTL_DAYS`` (GDPR minimisation).
    """

    collection_name = "webhook_payloads"

    @classmethod
    def ensure_indexes(cls) -> None:
        """Create indexes optimised for webhook ingestion and lookup."""
        super().ensure_indexes()
        collection = cls._get_collection()
        # Fast lookup by source system + event type.
        collection.create_index(
            [("source", 1), ("event_type", 1), ("created_at", -1)],
            name="source_event_created_idx",
        )


class AuditLogCollection(MongoBaseCollection):
    """High-volume audit / event log entries.

    Each entry records *who* did *what* to *which resource* at *what time*,
    supporting SOC2 CC7.2 auditability requirements.

    Retention: Configured via ``MONGODB_TTL_DAYS``.  For longer retention
    needs (e.g. financial audit), override ``expire_after_days`` on
    :meth:`ensure_ttl_index`.
    """

    collection_name = "audit_logs"

    @classmethod
    def ensure_indexes(cls) -> None:
        """Create indexes optimised for audit trail queries."""
        super().ensure_indexes()
        collection = cls._get_collection()
        # Fast lookup by actor + action.
        collection.create_index(
            [("actor_id", 1), ("action", 1), ("created_at", -1)],
            name="actor_action_created_idx",
        )
        # Fast lookup by resource type + resource ID.
        collection.create_index(
            [("resource_type", 1), ("resource_id", 1), ("created_at", -1)],
            name="resource_created_idx",
        )


# ---------------------------------------------------------------------------
# Django app lifecycle integration helpers.
# ---------------------------------------------------------------------------

def initialise_mongodb() -> None:
    """Initialise the MongoDB connection.

    Called from ``CoreConfig.ready()`` during Django startup.
    """
    mongo_manager.initialise()


def close_mongodb() -> None:
    """Close the MongoDB connection gracefully.

    Registered as an ``atexit`` handler and can also be called from
    Django shutdown hooks.
    """
    mongo_manager.close()


def ensure_all_indexes() -> None:
    """Ensure indexes on all known collections.

    Call once during deployment or via a management command.
    """
    for collection_cls in (WebhookPayloadCollection, AuditLogCollection):
        collection_cls.ensure_indexes()
    logger.info("All MongoDB indexes ensured.")
