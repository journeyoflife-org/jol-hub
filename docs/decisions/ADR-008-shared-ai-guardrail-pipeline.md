# ADR-008: Shared AI Guardrail Pipeline — Extraction into `packages/ai-guardrails`

---

## Status
Accepted — ratified by platform owner 2026-08-27 (DECISION-LOG D-012, verbatim
sign-off "ADR-008 shared AI guardrail pipeline: APPROVED"). Phase 3.5,
docs-only; no runtime code changes in this ADR. Supersedes nothing; extends
D-008/D-009. Consumer spec-reference migration per ASSUME-GUARD-003 EXECUTED
2026-08-28 (docs-only references added to both AI specs; no runtime code).

## Numbering note (verified, not assumed)
Only ADR-001/002 exist on disk (verified 2026-08-27: `ls docs/decisions/`).
QODER.md cites ADR-003 (SOPS), ADR-005/007 (payment boundary) with **no files
present** — phantom references, tracked as O-016. ADR-003 is therefore
reserved-as-referenced, and this ADR takes **ADR-008**, the next genuinely
free number.

## Context
Two committed module specs depend on the same pipeline components:

- `docs/modules/ai-pastoral-assistant-spec.md` (D-008, `fc255391`) §6 pipeline:
  safety classifier, refusal constants, disclosure constants, PII strip,
  outcome-code taxonomy.
- `docs/modules/faq-chatbot-spec.md` (D-009, `da674567`) §5 reuse/diverge
  table reuses that pipeline with **strictly harsher defaults**, and its §3
  states the inheritance rule: *"any future change to the shared pipeline that
  weakens a column here requires a change-controlled exception, not silent
  inheritance."*

Today the pipeline is specified twice in prose. With shared components living
in consumer specs, the inheritance rule is **unenforceable**: there is no
single artifact a change lands in, no contract a weakening change could
violate, and no test that could catch it. Silent divergence of a
safety-critical pipeline is a compliance risk (GDPR Art. 9 processing
boundaries; EU AI Act transparency obligations encoded in the disclosure
constants). A third consumer (any future AI surface) would make the
divergence surface cubic.

## Decision
1. **Extract the four shared components + outcome taxonomy into one
   workspace package: `frontend/packages/ai-guardrails`** (name verified
   collision-free 2026-08-27: no directory, zero repo references; the
   existing `ai/` tree is a data-only scaffold, no clash).
2. The package is the **single source of truth** for: safety classification
   rules, refusal constants (codes + localized strings), disclosure
   constants, PII-stripping heuristics, and the outcome-code taxonomy.
3. Consumers (clergy assistant, FAQ chatbot, any future surface) consume the
   package API and register a **consumer profile** (§ Enforcement). Per-
   consumer behavior NOT in the shared table (consent machinery, Bitrix
   tasks, storage policy, UI) stays consumer-owned.
4. **Docs-only now.** Both specs are updated to reference the package
   (migration plan below); implementation is a later gated task whose exit
   gate is the package's offline test suite.
5. ADR-002 discipline applies by analogy: build inside the monorepo, keep the
   package extractable; no satellite extraction today.

## Package design

### Module boundaries
| Module | Responsibility | Out of scope |
|---|---|---|
| `classifier` | Rule-first safety classification (confessional, crisis, safeguarding, impersonation, injection, forbidden classes); versioned per-locale rule sets; deterministic rule pass runs before any model fallback hook | Model hosting; inference calls |
| `constants` | Refusal + disclosure constants: machine codes + localized strings (LT/EN/RU via the `i18n` package convention); immutable at runtime | Constant *selection policy* (consumer-owned) |
| `pii` | Input/output PII-stripping heuristics (best-effort, documented limits per ASSUME-PAST-005) | Consent, storage |
| `types` | Outcome taxonomy: `answered \| refused \| escalated/contact_pointer`, refusal codes, pointer types; shared request/response shapes | Endpoint schemas (consumer API contracts stay consumer-owned) |
| `contracts` | Consumer-profile registry + profile-compliance assertion utilities | — |

### Public API surface (frozen at v1.0.0)
```text
classify(message, locale, rulesetVersion) → ClassificationResult
  { category, confidence, rule_id, model_fallback_eligible }
refusalFor(code, locale) → { text, code }        # constants only, never generated
disclosureFor(locale) → string                    # immutable constant
stripPii(text, direction: 'input' | 'output') → string
assertProfileSatisfied(consumerProfile, packageCapabilities) → void | throws
OUTCOME_CODES, REFUSAL_CODES                      # frozen string unions
```

### Versioning policy
- **SemVer, workspace-managed** (Turborepo/pnpm, same lifecycle as `packages/seo`).
- **Any weakening of a capability = MAJOR**, and MAJOR releases are blocked
  without a DECISION-LOG change-controlled exception entry citing every
  affected consumer profile. This makes the inheritance rule mechanical:
  weakening is not "avoided by discipline", it is *structurally expensive*.
- Additive rule sets / new locales / new refusal codes = MINOR. Fixes = PATCH.
- Rule sets carry their own version stamps so classifier behavior changes are
  auditable independently of package releases (SOC 2 CC8.1).

### Enforcement mechanism (inheritance rule, mechanically blocked)
1. Each consumer registers a **profile** in `contracts/`:
   - `clergy-assistant`: input cap 2048, output budget 150/300, turns 20,
     storage consent-path allowed, escalation side-effects allowed,
     classifier threshold default.
   - `faq-chatbot`: input cap 500, output budget 80, turns 6, storage
     absolutely zero, NO escalation side-effects, **lower** (more protective)
     classifier threshold, impersonation refusal mandatory.
2. **Contract tests** run in package CI (offline, mocked inference — same
   offline discipline as the consumer specs): every registered profile must be
   satisfiable by the current package capabilities; profiles are append-only
   except via change-controlled exception.
3. Weakening path for a package change: capability reduction → contract tests
   fail → release blocked → exception entry (D-number) required → profile
   amendment versioned → only then may the change merge. Silent weakening
   cannot pass CI.
4. New consumers **must register a profile before wiring the pipeline**
   (convention rule; enforced by PR review + a registry-completeness test).

## Test plan — where the existing 28 guardrail tests live
Classification/detection and constant-emission assertions are pure package
behavior → **move to package level**. Composition, side-effect, and UX
contract assertions → **stay consumer-level**.

### Package level (shared suite; run once for all consumers)
| Origin | Tests | What moves |
|---|---|---|
| Pastoral (`fc255391` §7) | T1 confessional detection (LT), T2 jailbreak/absolution, T3 injection containment, T4 crisis classification, T5 safeguarding classification, T8 third-party refusal, T12 disputation refusal | classifier outcomes + refusal codes only; Bitrix/consent assertions stay behind |
| FAQ (`da674567` §7) | T3 impersonation, T4 confession-adjacent (LT), T5 RU grief+theology split, T6 counsel refusal, T8 injection+enumeration refusal, T13 turn-limit classification input | same principle |
| Both | disclosure-presence assertions (pastoral T14, FAQ T11) | `disclosureFor(locale)` sweep — one shared matrix test |
| Both | PII non-echo (pastoral implicit, FAQ T7) | `stripPii` unit tests (input + output direction) |

### Consumer level (stay)
- **Pastoral:** T5 Bitrix pointer-only task; T6/T7 RAG citation + degraded
  unsourced flag; T9/T10 consent/storage behavior; T11 adversarial session
  termination; T13 RU drafting permission.
- **FAQ:** T1/T2 constant-composed crisis/bereavement composition (model never
  invoked); T9 answer ≤80 tokens + citation/staleness; T10 donation
  informational-only vs CLOSED payment boundary; T12 zero-persistence + log
  redaction; T14 rate limiting; bootstrap/consent widget gating.
- **Profile tests:** each consumer asserts its registered profile is
  satisfied by the installed package version (the enforcement mechanism).

Net effect: scenario prose stays where reviewers read it (specs), mechanical
assertions concentrate where changes land (package), and no test loses its
home.

## Consequences
- **Positive**: inheritance rule becomes mechanically enforceable; one audit
  surface for safety-critical logic; third+ consumers inherit safely; offline
  CI retains full guardrail coverage; constants stay reviewable as data.
- **Negative**: new package = new gate obligations (verify chain, tests,
  CODEOWNERS per repo kit); consumers gain an API-dependency; profile
  registry is ceremonial overhead for small consumers (accepted: safety over
  ceremony reduction).
- **Neutral**: no runtime change today — both modules remain unimplemented.

## Alternatives considered
1. **Keep pipeline prose in both specs** — rejected: inheritance rule
   unenforceable (the exact risk this ADR closes).
2. **Extract to a satellite repo** — rejected: ADR-002 discipline (monorepo
   first, extractable later); satellite adds drift-control cost before the
   pattern proves itself.
3. **Copy-paste per consumer with manual review** — rejected: manual review
   is precisely the "silent divergence" failure mode; SOC 2 CC8.1 prefers
   mechanical controls.

## Compliance
- GDPR Art. 9: single governed boundary for special-category-adjacent
  classification/refusal logic.
- EU AI Act Art. 50: disclosure constants versioned and immutability-tested.
- SOC 2 CC8.1 / ISO 27001:2022 A.8.32: weakening = change-controlled
  exception, append-only profiles.

## Rollback
This ADR is documentation. Rejection = do not merge the follow-up log commit /
revert it (`git revert <sha>`); specs remain self-contained as today.
