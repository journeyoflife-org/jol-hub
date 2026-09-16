# Cross-Spoke Sweep Evidence — 10 Vertical Sites (Task 4.2)

> **Date:** 2026-09-11
> **Hub branch:** `feat/pages-step6` @ `373e0b89`
> **Scope:** All 10 spokes (basilica + 9 batched in Task 4.1)

## 1. Satellite Kit Drift (SHA-256 byte-identity)

Each spoke's governance files compared against `jol-hub/docs/templates/jol-frontend-repo-template/`:

| File | basilica | cathedral | diocese | deanery | parish | funeral | cemetery-care | protestant | orthodox | other-church |
|---|---|---|---|---|---|---|---|---|---|---|
| `.sops.yaml` | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH |
| `scripts/sops-validate.py` | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH |
| `secrets/README.md` | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH | MATCH |

**Result: 30/30 MATCH — zero drift across all 10 spokes**

## 2. Payment Boundary (INV-3)

`check-payment-boundary.sh` — no PSP SDK imports in any spoke:

| Spoke | Result |
|---|---|
| All 10 spokes | PASS |

**Result: 10/10 PASS**

## 3. Theme Literals (INV-7)

`check-theme-literals.sh` — no denomination/country literals in `src/app/` or `src/components/`:

| Spoke | Result |
|---|---|
| All 10 spokes | PASS |

**Result: 10/10 PASS**

## 4. Hreflang + Canonical (3-locale)

All 10 spokes include:
- `buildHreflang()` generating lt/en/ru alternates
- `buildCanonical()` generating locale-specific canonical URL
- `resolveLocale()` with anti-silent-fallback policy
- `SupportedLocale = 'lt' | 'en' | 'ru'`

**Result: 10/10 hreflang + canonical present**

## Summary

| Check | Total | Pass | Fail |
|---|---|---|---|
| Satellite kit drift | 30 | 30 | 0 |
| Payment boundary (INV-3) | 10 | 10 | 0 |
| Theme literals (INV-7) | 10 | 10 | 0 |
| Hreflang 3-locale | 10 | 10 | 0 |
| **TOTAL** | **60** | **60** | **0** |

**Cross-spoke sweep: CLEAN — zero violations across 10 spokes.**
