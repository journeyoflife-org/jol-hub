---
kind: error_handling
name: Django DRF Exception Handling and Frontend Structured Logging
category: error_handling
scope:
    - '**'
source_files:
    - backend/django/apps/core/exceptions.py
    - backend/django/core/settings/base.py
    - backend/django/core/urls.py
    - backend/django/apps/core/views.py
    - backend/django/apps/analytics/views.py
    - backend/django/apps/core/vault.py
    - frontend/packages/observability/src/logger.ts
    - frontend/apps/admin-dashboard/src/app/api/auth/[...nextauth]/route.ts
---

## Backend (Django / DRF)

The JOL-HUB backend centralizes error handling around two layers: a custom DRF exception handler that normalizes API responses, and Django URL-level error handlers that render consistent JSON for HTTP 400/403/404/500/429.

### Custom DRF exception handler
- `backend/django/apps/core/exceptions.py` defines `custom_exception_handler(exc, context)`, which wraps the default DRF `exception_handler` and rewrites every response into a uniform envelope:
  ```json
  { "error": "<snake_case_code>", "message": "<human-readable message>", "details": [...] }
  ```
- Validation errors (`ValidationError`) are mapped to `{ error: "validation_error", message: "Invalid input.", details: <field_errors> }`; other DRF exceptions keep their original `detail` as the message and derive an `error` code from it.
- The handler is wired globally via `REST_FRAMEWORK['EXCEPTION_HANDLER'] = 'apps.core.exceptions.custom_exception_handler'` in `backend/django/core/settings/base.py` (line 322).

### Django URL-level error handlers
- `backend/django/core/urls.py` registers `handler400`, `handler403`, `handler404`, `handler500` pointing to functions in `backend/django/apps/core/views.py`.
- Each handler returns a `JsonResponse` with a stable `error` code and a `message_key` referencing an i18n key under `error.http.<code>` (e.g. `error.http.400`, `error.http.403`, `error.http.404`, `error.http.500`, `error.http.429`). A dedicated `permission_denied` handler covers 403 and a `ratelimited` handler covers 429.
- These handlers cover non-API Django views; API requests go through the DRF exception handler instead.

### Business-layer error signaling
- Domain apps raise `rest_framework.exceptions.ValidationError` for request validation failures (e.g. `analytics/views.py` raises `ValidationError` for missing/invalid `organization_id`, date ranges, pagination params). This flows through the custom handler above.
- Views also return explicit `status.HTTP_4xx_BAD_REQUEST` / `_NOT_FOUND` / `_FORBIDDEN` responses directly in some cases (e.g. `donations/views.py`, `crm/api/views.py`, `core/metrics_endpoint.py`), typically paired with a JSON body describing the failure.
- There is no shared application-wide `Exception` hierarchy; each app raises built-in Python exceptions (`ValueError`, `RuntimeError`, `ImportError`, `PermissionError`) or DRF `ValidationError`. The data pipeline module (`data/src/`) follows the same pattern — raising `ValueError`/`RuntimeError`/`ImportError` at validation boundaries.

### Logging and error persistence
- Django's logging config in `settings/base.py` defines `console`, `file`, and `error_file` handlers. `error.log` is a rotating file handler limited to `ERROR` level; `jolhub.log` captures all levels. `AdminEmailHandler` emails admins on `ERROR` when `DEBUG=False`.
- External integrations (e.g. `apps/core/vault.py`) log Vault HTTP errors via `logger.error(f"Vault error: {response.status_code} - {response.text}")`.

## Frontend (Next.js / Turborepo)

Frontend error handling is not centralized in a single framework but relies on a structured logger package plus per-app try/catch patterns.

### Structured logger
- `frontend/packages/observability/src/logger.ts` provides `createLogger()` producing a zero-dependency JSON-lines logger with levels `debug|info|warn|error|fatal`, auto-redaction of PII fields, and a `child(bindings)` factory for request-scoped context (tenant, locale, requestId).
- Production defaults to `minLevel='info'` (no debug logs); `LOG_LEVEL` can override. Error/fatal records flush immediately from the batching sink so diagnostics are never lost.
- Logs are emitted to stdout (or a custom sink) and consumed by Loki/Promtail in Kubernetes.

### Per-app error handling
- Next.js route handlers (e.g. `frontend/apps/admin-dashboard/src/app/api/auth/[...nextauth]/route.ts`, `bitrix24/webhook/route.ts`) use `try/catch` blocks and throw `new Error(...)` messages that propagate back to the client.
- Client-side fetch wrappers throw `Error('Failed to fetch ...')` when `response.ok` is false, leaving error presentation to the calling component.
- The template-renderer app exposes `/api/telemetry/errors` which calls `logger.error('client error reported', {...})` to ship browser-side errors to the backend observability pipeline.

## Conventions observed

1. **API errors are normalized**: All DRF responses pass through `custom_exception_handler`, guaranteeing `{error, message, [details]}` shape for clients.
2. **Non-API Django errors are i18n-keyed**: 400/403/404/500/429 handlers return `{error, message_key}` so the frontend can look up localized strings.
3. **Validation uses DRF `ValidationError`**: Domain views raise this rather than returning raw 400s, letting the central handler format field errors uniformly.
4. **Logging is structured and redacted**: Frontend logs always include `time`, `level`, `msg`, `service` and deep-redact user-supplied fields; backend uses Django's `logging` with separate `error.log` rotation.
5. **No global panic/recover**: Python code raises exceptions; there is no `try/except` blanket catch at the view layer — errors bubble to the DRF handler or Django URL handler.