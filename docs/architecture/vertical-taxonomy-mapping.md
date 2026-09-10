# Vertical Taxonomy & Repository Naming Reconciliation

> **Authoritative decision:** ADR-011 + DECISION-LOG D-064 (2026-09-11).
> This document locks the naming decisions for the ten spoke repositories
> and reconciles the canonical taxonomy with ROPA records, page packages,
> layout families, and templates.

## Reconciliation Table

| # | Repo name | Canonical `Vertical` | ROPA dir | Page pkg | Layout family | Template | Commercial |
|---|---|---|---|---|---|---|---|
| 1 | `jol-site-basilica` | `basilica` | `basilica/` | `03-basilica-landing` | sacred | `church-template` | No |
| 2 | `jol-site-cathedral` | `cathedral` | `cathedral/` | `04-cathedral-landing` | sacred | `church-template` | No |
| 3 | `jol-site-diocese` | `diocese` | `diocese/` | `05-diocese-landing` | administrative | `diocese-template` | No |
| 4 | `jol-site-deanery` | `deanery` | `deanery/` | `06-deanery-landing` | administrative | `deanery-template` | No |
| 5 | `jol-site-parish` | `church` | *(see note)* | `08-church-landing` | sacred | `church-template` | No |
| 6 | `jol-site-funeral` | `funeral` | `funeral/` | `10-funeral-landing` | memorial | `funeral-template` | Yes (booking) |
| 7 | `jol-site-cemetery-care` | `cemetery-cleaning` | `cemetery-cleaning/` | `11-cemetery-landing` | memorial | `cleaning-template` | Yes (booking) |
| 8 | `jol-site-protestant` | `protestant` | `protestant/` | `09-protestant-landing` | eastern | `church-template` | No |
| 9 | `jol-site-orthodox` | `orthodox` | `orthodox/` | `09-orthodox-landing` | eastern | `church-template` | No |
| 10 | `jol-site-other-church` | `other-church` | `other-church/` | `09-other-church-landing` | eastern | `church-template` | No |

**Note on parish ROPA dir:** The `church` vertical does not have its own
ROPA directory because parish churches share the diocese-level ROPA
record (they are not independent data controllers). Each parish church
tenant has its own schema in PostgreSQL (`t_<slug>`) but the ROPA
record is at the diocese level.

## Dormant vertical

| Canonical `Vertical` | Spoke | Rationale |
|---|---|---|
| `diaconate` | **None** | No diaconate tenants, ROPA records, or page packages exist. MASTER-PROMPT §5 lists Diaconate but the owner's ten verticals do not. Diaconate remains in the canonical `Vertical` type as a dormant value; adding a spoke is a single-repo addition, not a topology change. |

## Naming Decisions (locked)

| Decision | Chosen | Rejected | Rationale |
|---|---|---|---|
| Other-church repo | `jol-site-other-church` | `jol-site-church` | `jol-site-church` collides with the parish church vertical; `other-church` matches the canonical `Vertical` value |
| Cemetery repo | `jol-site-cemetery-care` | `jol-site-grave-care`, `jol-site-cemetery` | `cemetery-care` aligns with the canonical `cemetery-cleaning` vertical; `normalizeVertical('cemetery')` already maps to `cemetery-cleaning` |
| Deanery repo | `jol-site-deanery` | `jol-site-deaneries` | Singular matches all other repo names (basilica, cathedral, diocese — all singular) |
| Parish repo | `jol-site-parish` | `jol-site-church` | `parish` is the user-facing term; `church` is the canonical `Vertical` value but would collide with the general concept |

## Source Code Contracts

The canonical `Vertical` type is defined in:
- `frontend/packages/tenant-resolver/src/types.ts` (11 values)

The normalization function is:
- `normalizeVertical()` in the same file (maps fixture-era aliases)

The template registry is:
- `frontend/apps/template-renderer/src/lib/template-registry.ts`
  (maps each `Vertical` to a lazy-loaded template)

The layout families are:
- `frontend/apps/template-renderer/src/lib/layout-families.ts`
  (5 structural families: sacred, eastern, administrative, memorial, congregation)

## Theme Vertical Mapping

The `themeVerticalFor()` function in `layout-families.ts` maps canonical
verticals to structural layout families:

| Vertical | Family |
|---|---|
| basilica, cathedral, church | sacred |
| protestant, orthodox, other-church | eastern |
| diocese, deanery | administrative |
| funeral, cemetery-cleaning | memorial |

The `diaconate` vertical has no layout family assignment (dormant).
