# Observability — STEP 16

Logging, error tracking, performance monitoring, health checks and
alerting for the template renderer — sized for 400k sites on modest
on-prem hardware (Proxmox, Grafana stack; no cloud lock-in).

## Architecture

```
 browser ──error reports──▶ /api/telemetry/errors ──▶ structured log ─┐
 browser ──perf batches───▶ /api/telemetry/perf  ──▶ structured log ─┤
 browser ──web vitals─────▶ /api/perf (STEP 13)  ──▶ backend plane   │
 middleware ──request log (JSON-lines, requestId)────────────────────┤
                                                                     ▼
                                              stdout ──▶ Promtail ──▶ Loki
 LB ──probe──▶ /api/health (200/503)                 Prometheus ◀── alerts
                                                      Grafana dashboards
```

| Piece | File |
| --- | --- |
| Core (redaction, logger, fingerprinting, batching, health) | `packages/observability/src/` |
| Server logger binding | `src/lib/logger.ts` |
| Client error tracking (handlers, breadcrumbs, reporting) | `src/lib/error-tracking.ts` |
| Client bootstrap (mounted in root layout) | `src/components/ObservabilityClient.tsx` |
| Health endpoint | `src/app/api/health/route.ts` |
| Telemetry ingress | `src/app/api/telemetry/{errors,perf}/route.ts` |
| Alert rules | `observability/alert-rules.yml` |
| Dashboard | `observability/grafana-dashboard.json` |

## Log shape

One JSON object per line (Loki/Promtail-friendly):

```json
{"time":"2026-08-25T12:00:00.000Z","level":"info","msg":"request handled",
 "service":"template-renderer-edge","event":"request.handled",
 "requestId":"…","method":"GET","path":"/lt/…","status":200,"durationMs":41}
```

- `requestId` (x-request-id response header) correlates edge → route →
  client telemetry records.
- Levels: debug/info/warn/error/fatal. **Production never emits debug**
  (`levelFromEnv`).
- Middleware skips access logging for `/api/health` (LB probe flooding).

## PII redaction (RULES)

EVERY record is deep-redacted before serialization
(`redact.ts`, tested by a dedicated battery in
`packages/observability/src/__tests__`): emails, phones, card numbers,
JWTs, bearer tokens, AWS keys inline; `password/token/secret/cookie/…`
keys wholesale. The telemetry ingress RE-REDACTS server-side — the
client is untrusted.

GDPR consent split:
- **essential** (no consent needed): error reports without identity,
  security events, request logs (legitimate interest, Art. 6(1)(f));
- **analytics consent required**: breadcrumb trail, Web Vitals RUM,
  navigation/resource timing.

## Health checks

`GET /api/health` → `{ status, version, timestamp, dependencies }`;
dependencies: backend (critical), auth, crm, editor, payments.
`unconfigured` = pilot plane absent (not a fault); optional-plane
failure degrades; only the critical backend down returns **503** for
the LB. Probes are capped at 1.5 s.

## Alerting (P0–P3)

`observability/alert-rules.yml` (Prometheus format) — thresholds per
spec TASK 6: error rate > 1% / 5m (P0), 5xx > 10/min (P0), auth down
(P0), conversion drop > 20% (P1), booking failures > 5% (P1), LCP > 4s
for > 20% of users (P2), bundle > budget (P2), advisories (P3). Every
P0 annotation carries a **runbook link** (jol-infrastructure repo) and
the incident channel. Error tracker (self-hosted GlitchTip/Sentry,
ADR-gated) attaches at the telemetry ingress — the core stays
vendor-neutral.

## Retention (TASK 7)

| Class | Retention | Basis |
| --- | --- | --- |
| Application logs | **90 days** | SOC 2 CC7.2 |
| Security logs (auth attempts, rate limits, denials) | **1 year** | GDPR Art. 5, ISO 27001 A.8.15 |
| Audit logs (moderation decisions, permission changes) | **7 years** | legal requirement |
| Error-tracking issues | 90 days active, then cold archive | storage discipline |

Enforcement lives in jol-infrastructure (Loki `limits_config`
retention + Promtail pipeline classes); this repo ships the log shape
that makes the classification possible (`event` labels:
`security.*`, `client-error`, `request.handled`). Rotation is
automatic (Loki compaction, compressed chunks, integrity via object
hashes).

## Incident response (TASK 8)

1. P0 alert fires → incident channel with runbook link.
2. On-call correlates via `requestId` / fingerprint (dashboard panel 4).
3. P0 on the renderer host → hypervisor snapshot via jol-infrastructure
   automation (manual trigger retained — snapshots are not automatic).
4. Post-incident: copy
   `jol-infrastructure/runbooks/incident-report-template.md`, attach the
   Loki/Tempo query window + fingerprint list.

## Rollback

Observability is additive: remove `<ObservabilityClient />` +
`<WebVitals />` from the root layout to disable client telemetry; the
`/api/health` + server logs remain. No data-plane dependency.
