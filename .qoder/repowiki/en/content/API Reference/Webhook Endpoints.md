# Webhook Endpoints

<cite>
**Referenced Files in This Document**
- [payment_events/views.py](file://backend/django/apps/payment_events/views.py)
- [payment_events/models.py](file://backend/django/apps/payment_events/models.py)
- [integrations/urls.py](file://backend/django/apps/integrations/urls.py)
- [integrations/views.py](file://backend/django/apps/integrations/views.py)
- [integrations/tasks.py](file://backend/django/apps/integrations/tasks.py)
- [bitrix24/handlers.py](file://backend/integrations/bitrix24/webhooks/handlers.py)
- [crm/middleware.py](file://backend/django/apps/crm/middleware.py)
- [core/settings/base.py](file://backend/django/core/settings/base.py)
- [core/throttling.py](file://backend/django/apps/core/throttling.py)
- [payment-api-contract.md](file://docs/payment-api-contract.md)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document provides comprehensive API documentation for webhook endpoints that handle external service integrations. It covers:
- Payment event webhooks (internal marketplace-to-hub signed envelopes)
- CRM sync webhooks (Bitrix24 events)
- System notification webhooks (PayPal and Bitrix24 health endpoint)
- Event types, payload structures, signature verification, retry policies, error handling, security measures, implementation guides, and debugging strategies.

## Project Structure
The webhook system spans several modules:
- Payment events receiver enforces a strict signed-envelope contract with HMAC verification and idempotent persistence.
- Integration webhooks accept payloads from PayPal and Bitrix24, validate signatures, store raw payloads, and dispatch background tasks.
- Bitrix24 handlers perform country-scoped routing, tenant isolation, and CRM entity synchronization.
- Middleware injects tenant context for multi-tenant isolation.
- Settings register middleware and apps; throttling utilities provide rate-limiting patterns.

```mermaid
graph TB
subgraph "Ingress"
URLS["URL Router<br/>apps/integrations/urls.py"]
PAYVIEW["Payment Events View<br/>apps/payment_events/views.py"]
INTVIEWS["Integration Views<br/>apps/integrations/views.py"]
end
subgraph "Processing"
TASKS["Celery Tasks<br/>apps/integrations/tasks.py"]
B24H["Bitrix24 Handlers<br/>integrations/bitrix24/webhooks/handlers.py"]
end
subgraph "Storage"
DB["PostgreSQL Models<br/>apps/payment_events/models.py"]
MONGO["MongoDB Payload Store<br/>apps/core.mongodb (via views/tasks)"]
end
subgraph "Security & Context"
MW["Tenant Context Middleware<br/>apps/crm/middleware.py"]
THROT["Throttling Utilities<br/>apps/core/throttling.py"]
CONF["Settings & Middleware<br/>core/settings/base.py"]
end
URLS --> PAYVIEW
URLS --> INTVIEWS
INTVIEWS --> TASKS
INTVIEWS --> MONGO
TASKS --> B24H
PAYVIEW --> DB
B24H --> DB
MW -. applies to .-> INTVIEWS
MW -. applies to .-> PAYVIEW
CONF -. registers .-> MW
THROT -. available for .-> INTVIEWS
```

**Diagram sources**
- [integrations/urls.py:6-16](file://backend/django/apps/integrations/urls.py#L6-L16)
- [payment_events/views.py:79-143](file://backend/django/apps/payment_events/views.py#L79-L143)
- [integrations/views.py:30-51](file://backend/django/apps/integrations/views.py#L30-L51)
- [integrations/views.py:195-293](file://backend/django/apps/integrations/views.py#L195-L293)
- [integrations/tasks.py:93-294](file://backend/django/apps/integrations/tasks.py#L93-L294)
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)
- [payment_events/models.py:6-36](file://backend/django/apps/payment_events/models.py#L6-L36)
- [crm/middleware.py:96-154](file://backend/django/apps/crm/middleware.py#L96-L154)
- [core/settings/base.py:121-145](file://backend/django/core/settings/base.py#L121-L145)
- [core/throttling.py:15-77](file://backend/django/apps/core/throttling.py#L15-L77)

**Section sources**
- [integrations/urls.py:6-16](file://backend/django/apps/integrations/urls.py#L6-L16)
- [core/settings/base.py:121-145](file://backend/django/core/settings/base.py#L121-L145)

## Core Components
- Payment Events Receiver: Accepts signed payment-event envelopes, verifies headers, timestamp window, HMAC signature, product routing, validates envelope schema, deduplicates by event_id, persists, and returns idempotent responses.
- Integration Webhooks:
  - PayPal: Stores incoming payloads idempotently and queues async processing.
  - Bitrix24: Validates HMAC signature, parses JSON, checks required fields, computes idempotency key, stores raw payload in MongoDB, and queues async processing. Includes a health endpoint.
- Bitrix24 Handlers: Validate application token and signature, route to contact/deal/calendar handlers, sync entities into local CRM with tenant isolation, and log audit entries.
- Tenant Context Middleware: Extracts tenant context from JWT or headers, caches tenant info, and enforces data residency and compliance metadata per request.
- Throttling Utilities: Provide reusable throttle classes for sensitive endpoints (auth, GDPR export/delete, donations).

**Section sources**
- [payment_events/views.py:28-143](file://backend/django/apps/payment_events/views.py#L28-L143)
- [integrations/views.py:30-51](file://backend/django/apps/integrations/views.py#L30-L51)
- [integrations/views.py:195-293](file://backend/django/apps/integrations/views.py#L195-L293)
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)
- [crm/middleware.py:96-154](file://backend/django/apps/crm/middleware.py#L96-L154)
- [core/throttling.py:15-77](file://backend/django/apps/core/throttling.py#L15-L77)

## Architecture Overview
End-to-end flows for each webhook type:

```mermaid
sequenceDiagram
participant S as "Sender"
participant R as "Receiver (Django)"
participant T as "Celery Task"
participant H as "Bitrix24 Handler"
participant DB as "PostgreSQL"
participant M as "MongoDB"
Note over S,R : Payment Events (signed envelope)
S->>R : POST /internal/v1/payment-events<br/>Headers : X-Product, X-JOL-Timestamp, X-JOL-Signature
R->>R : Verify headers, timestamp window, HMAC, product
R->>R : Validate envelope schema
R->>DB : Persist PaymentEvent (idempotent by event_id)
R-->>S : 201 accepted or 200 duplicate
Note over S,R : Bitrix24 CRM Sync
S->>R : POST /api/v1/integrations/webhooks/bitrix24/
R->>R : HMAC verify, parse JSON, required fields
R->>M : Store raw_payload + idempotency_key
R->>T : Queue process_bitrix24_webhook(mongo_doc_id, country)
T->>H : Execute business logic (contact/deal/calendar)
H->>DB : Upsert CRM entities (tenant-scoped)
T-->>R : Mark status PROCESSED/IGNORED/FAILED
```

**Diagram sources**
- [payment_api_contract:29-83](file://docs/payment-api-contract.md#L29-L83)
- [payment_events/views.py:79-143](file://backend/django/apps/payment_events/views.py#L79-L143)
- [integrations/views.py:195-293](file://backend/django/apps/integrations/views.py#L195-L293)
- [integrations/tasks.py:93-294](file://backend/django/apps/integrations/tasks.py#L93-L294)
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)

## Detailed Component Analysis

### Payment Events Receiver
- Endpoint: POST /internal/v1/payment-events (contract-defined path; hub serves this path).
- Authentication: Signed-envelope HMAC using delivery key. Required headers: Content-Type, X-Product, X-JOL-Timestamp, X-JOL-Signature.
- Replay protection: Timestamp must be within ±300 seconds.
- Product routing: Only accepts product = "hub".
- Schema validation: Envelope whitelist enforced; unknown fields ignored.
- Idempotency: Dedupe by event_id; duplicates return 200 no-op.
- Persistence: Durable acceptance before any side effects.
- Error contract: 4xx never signals retry; 5xx reserved for unavailability.

```mermaid
flowchart TD
Start(["Receive POST"]) --> CheckFlags["Check feature flag"]
CheckFlags --> |Disabled| NotFound["404 not_found"]
CheckFlags --> |Enabled| Headers["Validate headers present"]
Headers --> |Missing| BadReq["400 missing_headers"]
Headers --> ParseTS["Parse timestamp"]
ParseTS --> |Invalid| BadTS["400 invalid_timestamp"]
ParseTS --> Window{"Within replay window?"}
Window --> |No| ReplayErr["401 timestamp_out_of_window"]
Window --> |Yes| HMAC["Compute expected HMAC"]
HMAC --> |Mismatch| SigErr["401 signature_mismatch"]
HMAC --> Product{"X-Product == 'hub'?"}
Product --> |No| RouteErr["400 misrouted_product"]
Product --> ParseJSON["Parse JSON body"]
ParseJSON --> |Invalid| JsonErr["400 invalid_json"]
ParseJSON --> Validate["Validate envelope whitelist"]
Validate --> |Violation| SchemaErr["400 schema_violation"]
Validate --> Dedupe{"event_id exists?"}
Dedupe --> |Yes| Dup["200 duplicate"]
Dedupe --> |No| Persist["Persist PaymentEvent"]
Persist --> Done["201 accepted"]
```

**Diagram sources**
- [payment_events/views.py:79-143](file://backend/django/apps/payment_events/views.py#L79-L143)
- [payment-api-contract.md:29-83](file://docs/payment-api-contract.md#L29-L83)

**Section sources**
- [payment_events/views.py:28-143](file://backend/django/apps/payment_events/views.py#L28-L143)
- [payment_events/models.py:6-36](file://backend/django/apps/payment_events/models.py#L6-L36)
- [payment-api-contract.md:29-83](file://docs/payment-api-contract.md#L29-L83)

### PayPal Webhook Ingestion
- Endpoint: POST /api/v1/integrations/webhooks/paypal/
- Behavior: Uses PayPal transmission ID for idempotency; stores payload; queues async processing via Celery task.
- Response: 200 with status received or duplicate if already stored.

**Section sources**
- [integrations/views.py:30-51](file://backend/django/apps/integrations/views.py#L30-L51)
- [integrations/tasks.py:81-90](file://backend/django/apps/integrations/tasks.py#L81-L90)

### Bitrix24 CRM Webhooks
- Endpoint: POST /api/v1/integrations/webhooks/bitrix24/
- Security: HMAC-SHA256 signature verification against configured secret; development mode logs warning when secret is absent.
- Validation: Requires valid JSON object and presence of event field.
- Idempotency: Computes deterministic key from auth.domain, event, data.FIELDS.ID, ts; fallback to SHA-256 of raw body.
- Storage: Raw payload stored in MongoDB with source, event_type, idempotency_key, country, raw_payload.
- Processing: Queues Celery task process_bitrix24_webhook with country for GDPR Article 44 routing.
- Health: GET /api/v1/integrations/webhooks/bitrix24/health/ returns circuit breaker status and audit chain integrity.

```mermaid
sequenceDiagram
participant B as "Bitrix24"
participant V as "Bitrix24WebhookView"
participant M as "MongoDB"
participant C as "Celery"
participant T as "process_bitrix24_webhook"
participant H as "Bitrix24Handler"
participant P as "PostgreSQL"
B->>V : POST with HMAC signature
V->>V : Verify signature
V->>V : Parse JSON, validate required fields
V->>V : Compute idempotency_key
V->>M : Insert raw_payload (unique key check)
V->>C : Delay task(mongo_doc_id, country)
C->>T : Invoke task
T->>H : Execute handler (contact/deal/calendar)
H->>P : Upsert CRM entities (tenant-scoped)
T-->>V : Update status PROCESSED/IGNORED/FAILED
V-->>B : 202 Accepted
```

**Diagram sources**
- [integrations/views.py:195-293](file://backend/django/apps/integrations/views.py#L195-L293)
- [integrations/tasks.py:93-294](file://backend/django/apps/integrations/tasks.py#L93-L294)
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)

**Section sources**
- [integrations/views.py:54-293](file://backend/django/apps/integrations/views.py#L54-L293)
- [integrations/tasks.py:93-294](file://backend/django/apps/integrations/tasks.py#L93-L294)
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)

### Bitrix24 Handler Details
- Validation: Application token and optional HMAC signature verification.
- Routing: Contact add/update/delete, Deal add/update/delete, Calendar add/update/delete.
- Sync: Updates or creates CRM entities with tenant isolation; soft deletes on removal; audit logging.
- Circuit Breaker: Health endpoint exposes breaker state and audit chain verification.

```mermaid
classDiagram
class WebhookHandler {
+register(event, handler)
+validate_webhook(event, request) bool
+handle(event) dict
+get_circuit_breaker_status() dict
+verify_chain_integrity() dict
}
class WebhookEvent {
+event string
+data dict
+timestamp string
+application_token string?
+auth dict?
+country string?
+entity_id string?
+tenant_id string?
}
WebhookHandler --> WebhookEvent : "processes"
```

**Diagram sources**
- [bitrix24/handlers.py:37-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L37-L152)
- [bitrix24/handlers.py:421-471](file://backend/integrations/bitrix24/webhooks/handlers.py#L421-L471)

**Section sources**
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)
- [bitrix24/handlers.py:421-471](file://backend/integrations/bitrix24/webhooks/handlers.py#L421-L471)

### Tenant Context Middleware
- Purpose: Establishes request-scoped tenant identification, row-level security enforcement, and audit context injection.
- Extraction: From JWT claims, X-Tenant-ID header, or user’s default organization.
- Validation: Checks active tenant and data residency region; caches tenant info.
- Usage: Applied globally via settings middleware stack; ensures cross-tenant isolation across webhook processing paths where applicable.

**Section sources**
- [crm/middleware.py:96-154](file://backend/django/apps/crm/middleware.py#L96-L154)
- [crm/middleware.py:156-299](file://backend/django/apps/crm/middleware.py#L156-L299)
- [core/settings/base.py:121-145](file://backend/django/core/settings/base.py#L121-L145)

## Dependency Analysis
Key dependencies and relationships:
- URL router wires webhook endpoints to views.
- Views depend on models for persistence and on tasks for async processing.
- Tasks depend on MongoDB for raw payload storage and PostgreSQL for tracking records.
- Bitrix24 handlers depend on CRM models and audit logging for compliance.
- Middleware integrates into Django request/response cycle for tenant context.
- Settings configure middleware and installed apps.

```mermaid
graph LR
URLs["integrations/urls.py"] --> PV["payment_events/views.py"]
URLs --> IV["integrations/views.py"]
IV --> IT["integrations/tasks.py"]
IT --> BH["bitrix24/handlers.py"]
PV --> PM["payment_events/models.py"]
IV --> MD["MongoDB (via core.mongodb)"]
BH --> CM["CRM models (via apps.crm.models)"]
MW["crm/middleware.py"] -. applied by .-> IV
CFG["core/settings/base.py"] -. configures .-> MW
```

**Diagram sources**
- [integrations/urls.py:6-16](file://backend/django/apps/integrations/urls.py#L6-L16)
- [payment_events/views.py:79-143](file://backend/django/apps/payment_events/views.py#L79-L143)
- [integrations/views.py:195-293](file://backend/django/apps/integrations/views.py#L195-L293)
- [integrations/tasks.py:93-294](file://backend/django/apps/integrations/tasks.py#L93-L294)
- [bitrix24/handlers.py:63-152](file://backend/integrations/bitrix24/webhooks/handlers.py#L63-L152)
- [crm/middleware.py:96-154](file://backend/django/apps/crm/middleware.py#L96-L154)
- [core/settings/base.py:121-145](file://backend/django/core/settings/base.py#L121-L145)

**Section sources**
- [integrations/urls.py:6-16](file://backend/django/apps/integrations/urls.py#L6-L16)
- [core/settings/base.py:121-145](file://backend/django/core/settings/base.py#L121-L145)

## Performance Considerations
- Fast acknowledgment: Bitrix24 view returns 202 Accepted quickly to avoid timeouts; heavy processing is offloaded to Celery.
- Idempotency: Prevents duplicate processing and reduces redundant work.
- Async processing: Celery tasks with autoretry for transient errors and backoff reduce load spikes.
- Storage separation: MongoDB for raw payloads decouples ingestion from relational writes.
- Tenant caching: Middleware caches tenant info to minimize database lookups.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Signature mismatch:
  - Ensure correct delivery key or Bitrix24 secret is configured.
  - Verify HMAC computation matches the sender’s method.
  - For payment events, confirm timestamp within replay window and raw body used for signature.
- Missing headers:
  - Confirm required headers are present (e.g., X-Product, X-JOL-Timestamp, X-JOL-Signature for payment events; X-Bitrix24-Signature for Bitrix24).
- Malformed payload:
  - Validate JSON structure and required fields (e.g., event field for Bitrix24).
- Duplicate events:
  - Expected due to at-least-once delivery; responses indicate duplicates without errors.
- Transient failures:
  - Celery retries automatically for infrastructure errors; monitor task logs and status transitions.
- Permanent failures:
  - Data validation errors mark events as FAILED; inspect error details and fix input or mapping.

**Section sources**
- [payment_events/views.py:79-143](file://backend/django/apps/payment_events/views.py#L79-L143)
- [integrations/views.py:195-293](file://backend/django/apps/integrations/views.py#L195-L293)
- [integrations/tasks.py:240-294](file://backend/django/apps/integrations/tasks.py#L240-L294)

## Conclusion
The webhook subsystem implements robust, secure, and compliant integrations for payments and CRM synchronization. It enforces strong authentication via HMAC signatures, replay protection, idempotency, and tenant isolation. Asynchronous processing and structured error handling ensure reliability and observability. Follow the provided contracts and configuration to implement custom handlers and debug delivery issues effectively.

[No sources needed since this section summarizes without analyzing specific files]