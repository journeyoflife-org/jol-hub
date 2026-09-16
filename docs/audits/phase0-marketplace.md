# Phase 0 Audit — jol-m-marketplace (Marketplace Tier-1 Tree)

| Attribute | Value |
|---|---|
| Phase | 0 (MASTER-PROMPT v2 §6) — first audit of the marketplace tree |
| Mode | **READ-ONLY** on `/opt/jol-m/repos/` — report committed to the HUB tree only (writing into an unaudited tree violates its own gate) |
| Date | 2026-08-27 · Branch `feat/pages-step6` (hub) |
| Feeds | Task M-1 (hub payment receiver + `docs/payment-api-contract.md`, O-017(1)); ADR-009 Model A verification |
| Rollback | Docs-only, hub tree: `git revert <sha>`. Zero marketplace-tree changes. |

## 1. Marketplace governance — conventions differ from hub (reported, not overridden)

| Hub convention | Marketplace reality | Verdict |
|---|---|---|
| QODER.md + MASTER-PROMPT + DECISION-LOG + numbered ADR files | **Docs-based governance**: `docs/ARCHITECTURE_DECISION_RECORDS.md` (registry ADR-0001…0010, detail in `TECH_DECISIONS.md`), plus `ASSUMPTIONS.md`, `COMPLIANCE_MATRIX.md`, `GDPR_COMPLIANCE.md`, `SECURITY.md`, `INCIDENT_RESPONSE.md`, `DEPLOYMENT.md`, `API_CONTRACT.md` | Their convention applies in their tree; hub rules apply only to this report |
| License: Apache-2.0 | **AGPL-3.0** (ADR-0002, README badge) | **License collision flag** — any hub-side vendoring of marketplace code would import copyleft; integration must stay API-only (already true under Model A) |
| Shallow git history | 4 commits, last `4faef0a` 2026-08-17 (`docs(pci): STEP20_EXECUTED.md + lint/gitleaks hygiene (#18)`) | Squashed/re-imported history — pre-import history unauditable offline |

## 2. Vitals, stack, deployment, dependency health

| Item | Value | Evidence |
|---|---|---|
| Purpose (from code) | Marketplace commerce platform: storefront, seller dashboard, moderation backoffice (ADR-0008); Django backend with domain-bounded apps incl. `payments_app`, `orders_app`, `shipping_app`; Next.js-style frontend | app tree, ADR registry |
| Stack | Python (145 tracked py): Django + `stripe>=10.0`, `celery[redis]>=5.4`, `psycopg[binary]>=3.1`; TS frontend (10 ts) | `backend/pyproject.toml`, file census |
| Deployment | docker-compose (dev/test/prod variants), images `jol-marketplace/{frontend,backend}:${IMAGE_TAG}`, `nginx:1.27-alpine`, certbot-webroot, Makefile | `docker-compose.prod.yml` |
| Dependency health | **CVE lookup impossible offline** — pins are floor-specs (`>=`), not exact pins; freshness unverifiable | pyproject |
| Dead code / forks | none observed; `__pycache__` dirs tracked-adjacent (untracked noise) | census |

## 3. Payment posture vs ADR-009 Model A — CONFIRMED in code

| Model A requirement | Marketplace state | Evidence |
|---|---|---|
| `payments_app` = sole Stripe integrator | **Confirmed** — their docs assert it ("payments_app is the only Stripe importer, ADR-0001"); all Stripe imports confined there | `docs/ARCHITECTURE_DECISION_RECORDS.md` L84; grep |
| Secrets env-injected, none committed | **Confirmed** — tracked secret-adjacent files = `.env.example` + `scripts/check_no_secrets.sh` only; settings read via `env_str(..., "")` | `git ls-files` grep; `base.py` L324–325 |
| Hub channel pre-wired | **Confirmed** — `INTERNAL_WEBHOOK_TARGETS["hub"]` → `/internal/v1/payment-events`, per-product delivery keys | `settings/base.py` L344–348; test.py mirror |
| Boundary discipline | Their CI runs gitleaks + `check_no_secrets`; STEP20 PCI hygiene recorded (last commit) | commit `4faef0a` |
| Test-mode state | **Posture documented, provisioning unverifiable offline**: settings comment "TEST mode keys only under test settings; secret store (never git)" — no `livemode` flag in code; whether Stripe keys are provisioned at all in this environment cannot be determined here | `base.py` L332; **ASSUME-MKT-001** |

## 4. HUB-RECEIVER REQUIREMENTS (feeds M-1) — enumerated from sender code

Source: `backend/apps/payments_app/internal_forward.py` + `tasks.py` (read-only).

1. **Endpoint**: `POST /internal/v1/payment-events` on the hub target configured in the sender's `INTERNAL_WEBHOOK_TARGETS["hub"]`.
2. **Routing**: sender routes by `intent.product`; the hub receives events where `product == "hub"`. No target configured ⇒ consumed locally by marketplace (donation flows must therefore set `product="hub"` on the intent).
3. **Headers**: `Content-Type: application/json` · `X-Product: hub` · `X-JOL-Timestamp: <unix-seconds>` · `X-JOL-Signature: <hex>`.
4. **Signature verification (MUST implement)**: `HMAC-SHA256(K_delivery, "{ts}.{sha256_hex(body_bytes)}")` — constant-time compare; enforce a timestamp window (replay protection); reject mismatch with 4xx. Delivery key = hub's value from sender's `INTERNAL_WEBHOOK_KEYS` (env-injected on their side; hub stores its own copy in Vaultwarden per hub secrets policy).
5. **Payload — exact 8-field PAN-free whitelist** (`ENVELOPE_FIELDS`): `event_id` (`evt_internal_<16 hex>`), `type`, `product`, `payment_intent_id`, `status`, `amount_cents` (integer), `currency`, `occurred_at` (ISO-8601). Nothing else crosses the boundary; receiver must tolerate no extra fields being present.
6. **Event types observed**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
7. **Delivery semantics**: **at-least-once** (Celery `max_retries=8`, base delay 30 s, raises on transport failure) → hub **MUST dedupe by `event_id`** before side effects.
8. **Response expectations**: HTTP < 500 counts as delivered (`raise_for_status` after delivery log) — so 4xx does NOT retry; 5xx/timeout does. Receiver: persist-before-process (outbox pattern), return 2xx only after durable acceptance; never 5xx on content validation errors (poison-pill risk).
9. **Idempotency discipline**: sender's Stripe handlers are idempotent by design ("each must be idempotent (Stripe retries)") — parity expected of the hub receiver.
10. **Timeout**: sender waits 10 s — hub receiver must ACK well inside that (async processing after durable accept).

## 5. Security findings

| ID | Finding | Severity |
|---|---|---|
| MS-01 | `jol-m-qoder-history` **mirrors hub S-01**: transcript archive (`exports/_shared/memories`, `exports/jol-m/`), **no remote**, **3 secret-pattern file matches** (pattern-matched only; content never reproduced) | HIGH |
| MS-02 | Pattern-probe matches in marketplace worktree: `frontend/.env.example` (template — acceptable) + `.venv` botocore/boto3 example corpora (third-party noise; untracked; same exemption class as hub guard's dependency-tree exemption) | LOW |
| MS-03 | Pre-import git history unauditable offline (4-commit squashed lineage) — any secret that lived before the import cannot be ruled out; treat marketplace-origin credentials as rotation candidates pending networked history review | MEDIUM |

## 6. Docs drift & the triple "ADR-0005" collision

- **Marketplace-internal collision**: `ARCHITECTURE_DECISION_RECORDS.md` registry defines **ADR-0005 = object storage (MinIO/S3)**, but `internal_forward.py` cites **"ADR-0005 §3" for the webhook-forwarding contract**, and the hub's guard lineage cites "ADR-0005 Model A" pointing at `jol-m-infrastructure/docs/payment-boundary-enforcement.md` (per the hub CI workflow header). One label, three namespaces. The hub-side fix stays O-016; the marketplace-side inconsistency is theirs to fix (**ASSUME-MKT-003**) — reported, not touched.
- `docs/API_CONTRACT.md` exists but grep for `payment-events`/`X-JOL` found **no coverage of the internal channel** — the contract lives in code comments only; the hub's missing `docs/payment-api-contract.md` (O-017(1)) should codify §4 above as the first canonical written copy.
- README badges claim CI/security workflows + ≥80% coverage + Lighthouse budgets — workflow existence not verifiable offline (**ASSUME-MKT-002**).

## 7. Assumption Register (→ DECISION-LOG, per O-014)

| ID | Assumption | Basis | Review trigger |
|---|---|---|---|
| ASSUME-MKT-001 | Stripe test keys are provisioned only outside git, via their secret store; live keys nowhere | Settings comment + no tracked secrets; provisioning unverifiable offline | Networked history review / their confirmation |
| ASSUME-MKT-002 | README CI/coverage/Lighthouse badge claims match reality | Offline — workflows unverifiable | Networked check |
| ASSUME-MKT-003 | `internal_forward.py`'s "ADR-0005 §3" refers to the jol-m-infrastructure payment-boundary doc, not the marketplace registry's storage ADR-0005 | Cross-file inference; owner confirmation needed | Marketplace owner |
| ASSUME-MKT-004 | Pre-import marketplace history contains no leaked credentials | Squashed lineage unauditable offline | Networked review; until then, MS-03 rotation-candidate posture |
| ASSUME-MKT-005 | Hub receiver (§4) can be built without any marketplace-tree change (sender contract is stable at HEAD `4faef0a`) | Contract read from code; no versioning scheme declared in their docs | M-1 kickoff re-verification |

## 8. Exit-criteria self-check

| Criterion | Status |
|---|---|
| Every finding evidenced | §1–6 tables cite file/line/command |
| Receiver requirements enumerated | §4, 10 items, implementation-ready |
| Assumptions registered | §7, five entries (appended to DECISION-LOG) |
| Read-only on marketplace tree | zero writes there; report lives in hub tree |
| Governance differences reported, hub rules not imposed | §1 |

## 9. Compliance note

Art. 9 boundary respected: envelope is PAN-free by whitelist and carries no
religious-affiliation fields — donation × affiliation linkage stays hub-side,
which is where the DPIA (O-013) applies. Marketplace ↔ hub channel uses
shared-key HMAC (adequate for internal on-prem delivery; mTLS upgrade is a
future hardening option, not a blocker). Payment boundary stays CLOSED
(ADR-009): this audit enables contract + dry-run work only.
