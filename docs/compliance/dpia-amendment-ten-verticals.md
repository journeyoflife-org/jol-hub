# DPIA Amendment — Ten Vertical Deployments

> **Date:** 2026-09-11
> **Amends:** Original DPIA (2026-Q2)
> **Scope:** 10 vertical spoke deployments on Proxmox VE 9.2
> **Governing:** GDPR Art. 35, SOC 2 CC6.1, ISO 27001 A.5.9

## 1. Minimum Assessed Platform Version

The DPIA covers the following minimum platform version:

| Component | Version | Evidence |
|---|---|---|
| jol-hub (Tier-0) | `feat/pages-step6` @ `389fb760` | Git commit hash |
| jol-frontend-repo-template | Same branch | SHA-256 satellite kit match |
| @jol-hub/* packages | 1.0.0 (12 packages) | tsup build artifacts |
| Proxmox VE | 9.2 | Infrastructure spec |
| Ubuntu Server | 24.04 LTS | Golden image |
| Node.js | 20.20.2 | Runtime spec |
| Next.js | 14 (App Router) | Framework spec |

## 2. Per-Vertical Annexes

Each vertical has a dedicated annex covering vertical-specific data processing:

| Annex | Vertical | Art. 9 data | Special considerations |
|---|---|---|---|
| A | Basilica | Gallery uploads (photos of sacred art) | Consent for image capture |
| B | Cathedral | Diocesan event flags | Cross-entity data sharing |
| C | Diocese | Deanery/parish directory | Entity graph joins |
| D | Deanery | Parish listing with contacts | Clergy role data (no names) |
| E | Parish | Sacrament records, mass schedules | RLS-scoped API for names |
| F | Funeral | Bereavement contacts, obituaries | Crisis-adjacent; safety.yml gate |
| G | Cemetery Care | Grave plot data, memorial photos | Commerce boundary (plots vs care) |
| H | Protestant | Tradition labels, congregation data | Denomination vocabulary (data, not code) |
| I | Orthodox | Native names (Cyrillic), jurisdiction | Julian/Gregorian calendar data |
| J | Other Church | Community listings, tradition labels | Denomination-agnostic rendering |

## 3. Art. 9 Review Queue — Gallery Uploads

Gallery uploads (basilica, parish, cemetery) trigger an Art. 9 review queue:

1. **Upload**: User submits image via spoke frontend
2. **Automated scan**: EXIF stripping, content hash, malware check
3. **Human review**: Content moderator verifies consent documentation
4. **Approval**: Image published only after explicit approval
5. **Audit trail**: Every state transition logged with timestamp + reviewer ID

**No gallery image is published without passing through this queue.**

## 4. Data Flows

```
Spoke (Next.js) → Vertical Router → Content API (RLS-scoped)
                                      ↓
                              PostgreSQL (schema-per-tenant)
                                      ↓
                              Audit log (append-only)
```

No cross-tenant data access. No PSP data in any spoke (D-052 freeze).

## 5. Retention

| Data class | Retention | Legal basis |
|---|---|---|
| Tenant fixture data | Until tenant offboarded | Legitimate interest |
| Gallery images | Until consent withdrawn | Consent (Art. 9) |
| Audit logs | 7 years | Legal obligation |
| Analytics (consent-gated) | 13 months rolling | Consent |
| Obituary data | Until next-of-kin requests removal | Consent (Art. 9) |

## 6. Risk Register Additions

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Unverified liturgical fact published | Medium | High | TODO markers; no publish without source |
| Clergy name leaked via fixture | Low | High | Names in RLS API only, never fixtures |
| Cross-tenant data leak | Low | Critical | Schema-per-tenant + RLS |
| Gallery image without consent | Medium | High | Art. 9 review queue |
| Silent locale fallback | Low | Medium | Anti-silent-fallback policy in resolve-locale.ts |

## 7. Sign-off

| Role | Name | Date | Status |
|---|---|---|---|
| Data Protection Officer | (owner) | TBD | Pending |
| Platform Architect | (agent session) | 2026-09-11 | Drafted |
| Security Reviewer | (owner) | TBD | Pending |
