---
kind: logging_system
name: 'Multi-Layer Logging: Django Structured Logs, Compliance Audit Trails, and Frontend JSON Lines'
category: logging_system
scope:
    - '**'
source_files:
    - backend/django/core/settings/base.py
    - backend/django/core/settings/test.py
    - backend/django/apps/crm/audit_logger.py
    - data/src/audit.py
    - frontend/packages/observability/src/logger.ts
    - frontend/packages/observability/src/redact.ts
---

## What system/approach is used

The JOL-HUB platform uses three complementary logging subsystems, each scoped to its runtime:

1. **Django backend** — Python `logging` module with a centralized `LOGGING` dict in `backend/django/core/settings/base.py`. It defines `verbose`, `simple`, and a `pythonjsonlogger.jsonlogger.JsonFormatter` (`json`) formatter; handlers include `console` (debug-only), `file` (rotating `jolhub.log`), `error_file` (rotating `error.log`, level ERROR only), and `mail_admins` (AdminEmailHandler, debug-false only). The root logger emits INFO to console; the `jolhub` logger is DEBUG when `DEBUG=True` else INFO; `django` and `django.request` are isolated with their own handlers.
2. **Compliance audit trail** — Two independent, tamper-evident audit loggers:
   - `backend/django/apps/crm/audit_logger.py` (`ComplianceAuditLogger`) writes structured `AuditEntry` rows via Django models and also emits human-readable lines on the `jolhub.crm.audit` logger for SIEM ingestion.
   - `data/src/audit.py` (`AuditLogger`) appends immutable JSONL records to daily files under an audit directory, chaining every event with SHA-256 hashes and HMAC-SHA256 signatures (SOC2 CC7.2 / ISO 27001 A.12.4.2) and persisting chain state in `chain-state.json`.
3. **Frontend (Next.js)** — A zero-dependency structured logger in `frontend/packages/observability/src/logger.ts` that emits one JSON object per line to stdout/stderr (the Loki/Promtail shape), with level gating (`info` minimum in production), deep PII redaction via `redact.ts`, and a client-side batching sink that flushes on error/unload.

## Key files and packages

- `backend/django/core/settings/base.py` — central `LOGGING` configuration (formatters, handlers, filters, root/loggers).
- `backend/django/core/settings/test.py` — overrides LOGGING to `NullHandler` + CRITICAL during tests so output stays clean.
- `backend/django/apps/crm/audit_logger.py` — `ComplianceAuditLogger` with GDPR legal-basis tracking, field-level change capture, sensitive-field masking, and HMAC-based integrity helpers.
- `data/src/audit.py` — `AuditLogger` + `AuditEvent` implementing append-only JSONL audit logs with hash-chain integrity, sequence numbers, and chain verification/reporting.
- `frontend/packages/observability/src/logger.ts` — `createLogger`, `levelFromEnv`, `createBatchingSink`; produces `{time, level, msg, service, ...}` JSON-lines.
- `frontend/packages/observability/src/redact.ts` — deep redaction of PII fields before serialization.
- `backend/logs/` — runtime log files produced by the rotating file handlers (`jolhub.log`, `error.log`, plus `django.log`, `security.log`, `audit.log`).

## Architecture and conventions

### Logger naming and hierarchy
- All application code uses `logging.getLogger(__name__)` or a domain-prefixed name such as `jolhub.health`, `jolhub.metrics`, `jolhub.tenant_validation`, `jolhub.crm.audit`. This lets the `jolhub` logger in settings control verbosity per component without touching call sites.
- The `django` and `django.request` loggers are explicitly reconfigured to write only to console (not propagate to root), keeping framework noise separate from app logs.

### Log levels
- Production default: root INFO, `jolhub` INFO (DEBUG when `DEBUG=True`). Errors route to `error_file` and `mail_admins`.
- Test environment: all loggers set to CRITICAL with a `NullHandler` to suppress output.
- Frontend: `minLevel` defaults to `info` in production, `debug` otherwise, resolved via `levelFromEnv` (`NODE_ENV` / `LOG_LEVEL`).

### Structured fields
- Backend structured format is provided by `pythonjsonlogger.jsonlogger.JsonFormatter` (formatter `json`); it serializes `asctime`, `name`, `levelname`, `message` into JSON lines suitable for log aggregators.
- Audit entries are fully structured dataclasses (`AuditEvent`, `FieldChange`, `AuditContext`) with explicit fields: `action/resource_type/timestamp/actor/actor_ip/resource_id/resource_name/metadata/legal_basis/data_categories/retention_period_days/sequence_number/prev_hash/event_hash/signature`.
- Frontend records always carry `time`, `level`, `msg`, `service` plus any caller-supplied bindings merged through `child()`.

### Sinks and routing
- Console → `StreamHandler` (debug builds).
- File → `RotatingFileHandler` with 10 MB max and 10 backups (`jolhub.log`, `error.log`).
- Email → `AdminEmailHandler` for ERRORs when not in debug mode.
- Audit trail → two sinks: (a) Django model persistence + `jolhub.crm.audit` logger for SIEM; (b) append-only JSONL files with persisted chain state.
- Frontend → stdout/stderr via `defaultSink`; optional batching transport for client telemetry.

### Integrity and compliance
- CRM audit logger enforces SOC2 CC7.2 / ISO 27001 A.12.4.2 via HMAC signatures over canonical JSON and a genesis-linked hash chain stored in `chain-state.json`.
- Data pipeline audit logger provides `verify_chain()` and `generate_compliance_report()` utilities for forensic checks and GDPR Article 30 reporting.
- Sensitive fields (`password`, `token`, `secret`, `key`, `credit_card`, `cvv`, `ssn`, `tax_id`) are masked to `[REDACTED]` in audit captures; special-category religious fields and PII fields are flagged in metadata.

## Conventions and constraints

- **Use `logging.getLogger(__name__)`** (or a `jolhub.*` namespace) rather than calling `logging.info()` directly — observed across analytics, content, core, health, metrics modules.
- **Never log below `info` in production** — enforced by frontend `levelFromEnv` which returns `info` when `NODE_ENV === 'production'`; backend root logger is INFO.
- **All log output must be JSON-lines** — backend uses `pythonjsonlogger` formatter; frontend logger emits one JSON object per line; audit logs are JSONL files.
- **PII is never emitted raw** — frontend `redactValue` deep-redacts all user-supplied fields before serialization; CRM audit logger masks sensitive fields and flags special-category changes.
- **Audit events are immutable** — every `AuditEvent` is sealed with `prev_hash`, `sequence_number`, `event_hash`, and HMAC `signature`; chain state is persisted and verified via `verify_chain()`.
- **Test runs produce no logs** — `test.py` sets `disable_existing_loggers: True`, routes root and `jolhub` to `NullHandler` at CRITICAL.
- **Log rotation is mandatory for persistent files** — both `jolhub.log` and `error.log` use `RotatingFileHandler` with 10 MB size and 10 backups.