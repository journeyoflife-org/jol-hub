# International SEO & Domain Strategy — JOL 27-Country Platform

| Attribute | Value |
|---|---|
| Phase | 1.1 (MASTER-PROMPT v2 §6 Phase 1) |
| Status | **DEGRADED SCOPE** — see banner below |
| Date | 2026-08-27 |
| Author | Platform architect (agent session, branch `feat/pages-step6`) |
| Governing sources | MASTER-PROMPT §4/§5/§10/§11 · ADR-001 · D-002 · `frontend/apps/template-renderer/SEO.md` (STEP 11) · `packages/seo` |
| Rollback | Docs-only. `git revert <sha>` removes this file; zero runtime impact. |

> **PREREQUISITE BANNER (DEGRADED SCOPE, ratified 2026-08-27).** Phase 0 is
> NOT signed off: `docs/audits/` does not exist, and Phase 0.1 halted at its
> entry gate (three repos still absent from `/opt/jol/repos/`). The platform
> owner explicitly authorized proceeding in degraded scope. Consequence: the
> 25-page inventory used in §6 is the list ratified in the Phase 1.1 task
> brief (consistent with MASTER-PROMPT §5 verticals), NOT the future
> `docs/audits/phase0-page-inventory.md`. Items 1–4 depend only on ratified
> sources; item 6's per-page refinement is ASSUME-tagged until the Phase 0
> inventory lands. Every assumption is registered in §7.

## 1. Hub domain evaluation — keep `jol-hub.com`

### 1.1 Verdict

**KEEP `jol-hub.com` as the hub domain. No rename.** A rename would require
re-branding, re-linking and 301-migrating an estate designed for ~400,000
tenant sites; the marginal keyword gain is zero (see 1.2) while the migration
risk is permanent equity loss. This is the least-regret option under every
criterion below.

### 1.2 Evaluation against the three required criteria

| Criterion | Finding | Evidence / tag |
|---|---|---|
| Brandability | `jol-hub` is short (7 chars), ASCII-safe, pronounceable in all 27 EU markets, and carries the ratified platform brand "JOL" (MASTER-PROMPT §1). `.com` is the default-trust TLD for cross-border entities. | Ratified brand (§1). `ASSUME-SEO-004`: no trademark-collision registry check possible offline. |
| Keyword relevance | Zero inherent keyword value: "jol"/"jol-hub" is an invented brand term with no search demand in any EU language — brand domains win on navigation, not on head terms. The real keyword surface is **native-language and local-intent**, which lives on the country domains (§2). A keyword-rich hub domain would therefore add nothing the architecture doesn't already capture better per market. | SEO principle: brand vs. head-term demand. Offline — no volume data; `ASSUME-SEO-002`. |
| Trust signals per market | Hub = international operator brand. For faith communities, institutional trust is signalled by the **local-language ccTLD** (`gyvenimo-kelias.lt` = "path of life"), not by the hub domain. The ratified architecture already splits these roles; the hub should never compete with its own tenants in local SERPs (that would also violate tenant non-enumeration, §2.3). | MASTER-PROMPT §4 domain architecture; ADR-001 / SOC 2 CC6.1. |

`ASSUME-SEO-001`: registration status, domain age, backlink profile and prior
ownership of `jol-hub.com` cannot be verified offline. Action: on first
networked access, run a backlink/history audit before investing in the hub's
content; prior penalty/spam history is the only finding that would reopen
this decision (and even then the remedy is disavow/cleanup, not rename).

### 1.3 Hub role definition (prevents cannibalization)

`jol-hub.com` is the **brand / corporate / marketplace hub**, not a content
competitor of tenant sites:

1. Country directory of tenant sites (linked, never enumerated server-side).
2. Marketplace home + vendor onboarding (`jol-m-marketplace` scope).
3. Corporate: packages (§6 pricing), legal, compliance, careers, press.
4. `x-default` landing for users with no market match (§3).

It must NOT publish local church/funeral/cemetery landing pages — those
belong to tenant domains by design.

## 2. URL structure — ccTLD per country + tenant subdomains

### 2.1 Decision matrix (weighted, machine-checkable)

Criteria weights: architecture fit 0.25 · GDPR/isolation 0.20 · local SEO
0.20 · 27-country scalability 0.15 · trust/CTR 0.10 · operational cost 0.10.
Scores 0–5 per option.

| # | Criterion | Weight | ccTLD + tenant subdomains | Subfolder on jol-hub.com | Subdomain per country on jol-hub.com |
|---|---|---|---|---|---|
| 1 | Fit with ADR-001 chain `subdomain → tenant → schema` | 0.25 | **5** — tenant IS the subdomain of the country domain (ratified, live) | 1 — tenant becomes a path segment; breaks the resolution contract | 3 — 3-level labels `{tenant}.{country}.jol-hub.com`; works but unnatural |
| 2 | GDPR Art. 9 isolation / jurisdiction clarity | 0.20 | **5** — per-country domain mirrors per-country legal entity & retention rules | 2 — all 27 markets on one `.com` domain concentrates risk surface | 3 — same `.com` domain, weaker per-market legal signalling |
| 3 | Local SEO (country targeting) | 0.20 | **5** — ccTLD is the strongest implicit geo signal; no Search Console geo step | 3 — subfolders are Google-supported but need per-folder targeting | 2 — subdomains are treated closer to separate sites, dilute geo signal |
| 4 | Scalability to 27 countries / ~400k tenants | 0.15 | **4** — registry cost & DNS ops per country; wildcard DNS + cert per country domain bounds it | 4 — one domain, cheap; but one origin for all markets | 4 — one domain; label depth grows |
| 5 | Trust & CTR in local SERPs | 0.10 | **5** — native-language ccTLD maximizes CTR for faith/funeral audiences | 2 — `.com/lt/...` reads foreign | 2 — `lt.jol-hub.com` reads foreign |
| 6 | Operational cost (TLS, DNS, Search Console) | 0.10 | 3 — 27 certs/DNS zones (mitigated: wildcard certs per country domain, automated ACME) | **5** — one zone, one cert | 4 — one zone, wildcard cert |
| | **Weighted total** | 1.00 | **4.55** | 2.60 | 2.95 |

**Decision: ccTLD per country with tenant subdomains** — the structure already
ratified (MASTER-PROMPT §4: `https://{tenant-slug}.gyvenimo-kelias.lt`) and
implemented. Subfolders lose on the two heaviest criteria (architecture fit,
isolation) and would force a rewrite of tenant resolution; country subdomains
on `.com` are dominated by ccTLDs on every local-SEO dimension.

### 2.2 Config-level country addition — LV and EE acceptance checklist

Adding Latvia and Estonia requires **zero code changes**. Per country:

| Step | Artifact | Type |
|---|---|---|
| 1 | `countries/lv/config/` — add `locale.yml`, `seo.yml` (hreflang set `lv-LV/en-LV/ru-LV`, x-default `lv`); `compliance.yml`, `liturgical.yml` already exist | config |
| 2 | Same for `countries/ee/` (`et-EE/en-EE/ru-EE`, x-default `et`) | config |
| 3 | Tenant seed fixtures under `frontend/packages/seed-data/src/fixtures/tenants/` (same JSON shape as `diocese-vilnius.json`: slug, vertical, locale, name/tagline per locale, identity, pages) | seed data |
| 4 | DNS: wildcard `*.dzives-cels.lv` / `*.elu-tee.ee` → pilot ingress | jol-infrastructure |
| 5 | TLS: wildcard cert per domain (ACME) | jol-infrastructure |
| 6 | Search Console: domain property per ccTLD | ops |
| 7 | hreflang set passed as a parameter — `buildSeoAlternates(locales = PILOT_HREFLANG, xDefaultLocale)` already parameterized in `packages/seo/src/hreflang.ts`; country config supplies the set | config wiring only |

Proof of config-level reuse: the renderer's tenant chain
(`[locale]/[tenant]/...`) resolves origin from `X-Forwarded-Host`
(SEO.md §"Origin resolution"), so the same binary serves any country domain.
README drift note: `countries/*/config/seo.json` is claimed by README but
absent on disk — step 1 above creates the first real instance
(`ASSUME-SEO-007`: YAML vs JSON format to be fixed at implementation to match
existing `compliance.yml`/`liturgical.yml` convention — YAML recommended).

### 2.3 Non-enumeration rule (security constraint on all URL choices)

No hub-level sitemap index, no cross-tenant URL listing, no country page that
lists all tenant slugs server-side (SEO.md hard rule 5; ADR-001; SOC 2 CC6.1).
Discovery paths are: search engines, direct links, and the hub's country
directory rendered from curated/consented entries only.

## 3. hreflang matrix

### 3.1 Pilot matrix (Lithuania — implemented, verified)

Per localized page on `{tenant}.gyvenimo-kelias.lt`:

| hreflang | URL pattern |
|---|---|
| `lt-LT` | `https://{tenant}.gyvenimo-kelias.lt/lt/{path}` |
| `en-LT` | `https://{tenant}.gyvenimo-kelias.lt/en/{path}` |
| `ru-LT` | `https://{tenant}.gyvenimo-kelias.lt/ru/{path}` |
| `x-default` | the `lt` URL (`X_DEFAULT_LOCALE = 'lt'`, `hreflang.ts`) |

Invariants already enforced in code and preserved by this strategy:
**reciprocity by construction** (every page emits the identical complete set —
unit-tested by `verifyHreflangReciprocity`), absolute URLs only, alternates
scoped to the single resolved tenant (no enumeration).

### 3.2 Per-country pilot matrices

| Country | Domain | Alternates | x-default |
|---|---|---|---|
| Lithuania | `*.gyvenimo-kelias.lt` | `lt-LT`, `en-LT`, `ru-LT` | `lt-LT` (implemented) |
| Latvia | `*.dzives-cels.lv` | `lv-LV`, `en-LV`, `ru-LV` | `lv-LV` |
| Estonia | `*.elu-tee.ee` | `et-EE`, `en-EE`, `ru-EE` | `et-EE` |

Rationale for including `ru-*` in all three Baltic pilots: Russian-speaking
minorities are a real audience in LT/LV/EE; served as a **locale of the
country site** (region-tagged `ru-LT/LV/EE`), never as a Russia-market
property. Russia is not in the 27-country scope.

### 3.3 Extension rule to 27 locales (machine-checkable)

1. Each country domain `D_c` emits one alternate per configured locale
   `l ∈ L_c`: `hreflang="{l}-{c}"` → `https://{tenant}.D_c/{l}/{path}`.
2. `L_c` ⊇ `{national language, en}`; additional languages only where a real
   audience exists (config-driven, `countries/{c}/config/seo.yml`).
3. `x-default` = the national-language URL of `D_c`.
4. **Alternates never cross country domains.** Cross-domain relationships are
   restricted to: (a) hub ↔ country home pairings, (b) shared legal/brand
   pages. A full 27-country × N-locale mesh would generate O(27²) alternate
   pairs per page — crawl-wasteful and error-prone; Google treats hreflang as
   a hint and intra-domain completeness is what prevents mis-serving.
5. Multi-language countries add a locale per official language with the same
   country region: Belgium → `fr-BE`, `nl-BE`, `de-BE`; Finland → `fi-FI`,
   `sv-FI`; Ireland → `en-IE` (+ `ga-IE` if served).
6. Reciprocity test (`verifyHreflangReciprocity`) runs against every emitted
   set; a country config that breaks symmetry fails CI.

Multi-language split-country edge (`ASSUME-SEO-008`): Cyprus (`el-CY`/`tr`),
and any market where a served language maps to a different-state region, are
deferred to per-market config review at country onboarding — the rule above
covers all 27 with no code change; exceptions are data, not architecture.

### 3.4 Hub hreflang

`jol-hub.com`: `en` content with `x-default` + one alternate per country
HOME page (`https://jol-hub.com/{country-slug}` ↔ `https://D_c/`) only where
the country site publishes a matching landing. No locale mesh on the hub.

## 4. Per-market keyword-research methodology

### 4.1 Data sources

| Source | Access model | Use |
|---|---|---|
| Middleware request logs (`[tenant] <slug> <vertical> <method> <path>`, SEO.md) + crawler-UA filtering via jol-analytics-ai | **On-prem, available offline** | Zero-party query/path demand per tenant |
| Google Search Console per tenant domain (one property per domain, SEO.md §Indexing) | Requires network | Impressions/CTR/query mining post-launch |
| Bing Webmaster Tools + IndexNow submission data (`buildIndexNowPayload()` contract exists) | Requires network | Bing/Yandex/Seznam coverage |
| Google Keyword Planner, Google Trends | Requires network + account | Volume & seasonality (Easter/All Souls/funeral seasonality) |
| EU-jurisdiction keyword/visibility tools | Requires network | Market sizing; any tool choice needs the EU-jurisdiction review mandated for external providers (MASTER-PROMPT §2.4 discipline) |
| Competitor SERP review, incl. legacy `*.bitrix24site.ru` queries | Requires network | Gap analysis before legacy retirement |

`ASSUME-SEO-003`: no volume figures appear in this document; all volume-based
claims are deferred to networked research. Methodology is complete without
them; numbers are inputs, not design constraints.

### 4.2 Intent mapping (intent → page class → schema type)

| Intent | Example patterns (per language) | Page class | Schema (§6) |
|---|---|---|---|
| Informational | "mišių laikai {miestas}", "laiks dievkalpojumiem" | parish home / events / liturgy | `Event`, `Church` |
| Navigational | "{parapija} kontaktai", tenant brand names | about/contact | `ContactPage`, `Organization` |
| Commercial / transactional | "pirkti gėlių kapams", "kapų tvarkymas kaina" | services, marketplace, donation | `Service`, `Product`, `DonateAction` |
| Local | "laidotuvių namai Šiauliai", "apbedīšanas pakalpojumi" | funeral/cemetery landings | `FuneralHome`, `LocalBusiness` (+geo) |
| Crisis / pastoral | "ką daryti mirus artimajam" | funeral services + pastoral CTA | `FAQPage` + `Service` — content must be pastoral-first, commerce-second (compliance & ethics) |

### 4.3 Per-market process (repeatable for each of the 27)

1. Seed taxonomy from MASTER-PROMPT §5 verticals × §4 pilot hierarchy.
2. Native-speaker keyword discovery — **no translation transfer**: LT/LV/EE
   religious/funerary terminology is confession- and culture-specific
   (e.g., parish/deanery/diocese terms differ by denomination); RU keywords
   for Baltic audiences use Cyrillic and local usage patterns, not RU-Federation SERPs.
3. Map keywords → intent table (4.2) → existing page class; gaps become
   backlog modules (page-count packaging is banned — D-005).
4. Cluster to routes; one primary keyword per route; title pattern
   `{primary kw} | {tenant name}` via the existing `%s | {tenant.name}`
   template (SEO.md §Metadata), description clamped 150–160 chars.
5. Local SEO layer: Google Business Profile sync per tenant (backend
   `apps/gbp`, SEO.md), `sameAs` in Organization JSON-LD, NAP consistency
   from the tenant fixture `identity.address/phone/email`.

### 4.4 Canonical URL policy (ratified behavior, restated for 27 markets)

- Absolute, protocol + public domain; **no query parameters**; trailing-slash
  normalized (`packages/seo/src/canonical.ts`); UTM forks kept out of the
  index via `Disallow: /*?*`.
- Self-referencing canonical on every page. **Cross-locale pages never
  canonicalize to each other** — hreflang disambiguates locales; canonicals
  disambiguate duplicates only.
- Cross-country near-duplicates (same franchise content in LT vs LV):
  separate canonicals per country domain + hreflang where alternates exist;
  never canonical a country page to the hub.
- Legacy migration: per-path **301s** from the four audited
  `*.bitrix24site.ru` properties to the matching `{tenant}.gyvenimo-kelias.lt`
  routes (MASTER-PROMPT §4), executed at cutover, then retired; redirect map
  is a change-controlled artifact of jol-infrastructure.

### 4.5 Per-tenant sitemap strategy (ratified behavior, restated)

- One `sitemap.xml` per tenant domain, generated per-request for the resolved
  tenant only (force-dynamic; unresolved → empty). **No hub-level sitemap
  index** (non-enumeration, §2.3).
- URL policy from SEO.md §Sitemap: home daily/1.0, news daily/0.8, events
  hourly/0.9, static monthly/0.5; `lastmod` from content timestamps;
  hreflang alternates embedded per URL; `shardUrls()` enforces the 50,000-URL
  protocol cap (sharding binds only at industrialization scale).
- Submission: Search Console domain property per ccTLD + IndexNow for
  Bing/Yandex/Seznam on content mutations (backend owns the key).

## 5. schema.org type map (page inventory)

Per-page JSON-LD assignment for the 25-page inventory (task-brief list;
`ASSUME-SEO-005` pending Phase 0 inventory). Reuses ratified builders in
`packages/seo/src/structured-data.ts`; gaps marked.

| # | Page | Primary schema.org types | Required properties | Builder status |
|---|---|---|---|---|
| 1 | Homepage (tenant) | vertical subtype of `Organization` (`ReligiousOrganization` / `FuneralHome` / `LocalBusiness`) + `WebSite` | name, url, address, sameAs | Implemented |
| 2 | About / Mission | `AboutPage` + `Organization` | url, name | Implemented |
| 3 | Basilica landing | `Church` (+ `CatholicChurch` where precise) + `PlaceOfWorship` | name, address, geo, parentOrganization (diocese) | Gap — extend `localBusinessEntity` |
| 4 | Cathedral landing | `Church` (cathedral role via `additionalProperty`) | as #3 | Gap — as #3 |
| 5 | Diocese landing | `ReligiousOrganization` | name, address, memberOf/parent, numberOfEmployees optional | Partial — `ReligiousOrganization` path exists |
| 6 | Deaneries landing | `ItemList` of `ReligiousOrganization` | itemListElement with member orgs | Gap — reuse ItemList builder |
| 7 | Parish church landing | `Church` | as #3 | Gap — as #3 |
| 8 | Protestant churches landing | `PlaceOfWorship` + `additionalProperty` denomination | name, address, denomination | Gap — as #3 |
| 9 | Russian Orthodox churches landing | `Church` (Orthodox) + denomination property | as #3 | Gap — as #3 |
| 10 | Other churches landing | `PlaceOfWorship` (denomination-agnostic) | name, address | Gap — as #3 |
| 11 | Funeral services | `FuneralHome` + `Service` | name, address, telephone, areaServed, offers | Implemented path (`FuneralHome` vertical) |
| 12 | Cemetery services | `LocalBusiness` + `Service` (cleaning/care); graves as `Product` where sold | geo, openingHours, offers | Gap — `localBusinessEntity` available |
| 13 | Online store | `WebSite` + `Product` (+ `Offer`, VAT-inclusive) | name, image, offers.price+priceCurrency | Gap — `productEntity` builder available |
| 14 | Marketplace home | `WebSite` (+ `SearchAction` for VIP) | url, potentialAction | Gap — `websiteWithSearchEntity` available |
| 15 | Marketplace vendor dashboard | **noindex** (authenticated surface; robots policy by kind) | — | Implemented posture (SEO.md hard rule 4) |
| 16 | Donation flow | `DonateAction` + `Organization` (recipient) | agent omitted (donor privacy), recipient, object | Gap — new builder; see compliance note |
| 17 | Donation history / impact | `WebPage` (+ aggregated `ItemList`); per-donor views are **noindex authenticated surfaces** | url, name | Gap — new builder |
| 18 | Blog / News | `NewsArticle` + `BreadcrumbList` (+ list `ItemList`) | headline, author, datePublished/Modified | Implemented |
| 19 | Liturgy & resources | `Event` (masses/liturgy: startDate, location, organizer) + `BreadcrumbList` | as shown | Implemented |
| 20 | CRM dashboard (Bitrix24) | **noindex** — never crawled; lives in CRM layer (never CMS, MASTER-PROMPT §3) | — | Implemented posture |
| 21 | AI Pastoral Assistant | `FAQPage` on public entry only; conversation surfaces noindex, no personal data in JSON-LD | mainEntity Q/A pairs | Gap — `faqPageEntity` available |
| 22 | GPS cemetery map | `Map` + `CivicStructure`; plot-level data NEVER indexed (deceased-person privacy — see §8) | url, name | Gap — new builder |
| 23 | Legal & compliance | `WebPage` (+ `FAQPage` where Q/A) | url, name | Gap — trivial |
| 24 | Onboarding & training | `WebPage` (+ `Course` where structured) | url, name | Gap — trivial |
| 25 | Contact & support | `ContactPage` + `Organization` | url, contactPoint | Implemented |

Collection pages additionally emit `BreadcrumbList` + `ItemList` (implemented
pattern). All entity URLs absolute (SEO.md hard rule 1).

## 6. Assumption Register

| ID | Assumption | Basis | Review trigger |
|---|---|---|---|
| ASSUME-SEO-001 | Registration status, age, backlinks and prior ownership of `jol-hub.com` are acceptable (no penalty history) | Offline host; no WHOIS/backlink access | Run audit on first networked access; reopen §1.3 only if penalty history found |
| ASSUME-SEO-002 | "jol"/"jol-hub" carries no meaningful organic search volume in any EU language | Invented brand term; no volume data offline | Keyword Planner validation per market |
| ASSUME-SEO-003 | No keyword-volume figures are cited anywhere in this document; prioritization uses intent + architecture evidence only | Offline host | Populated by §4.3 process post-launch |
| ASSUME-SEO-004 | No trademark collision exists for JOL / jol-hub in EU classes of interest | No registry access offline | EUIPO/national registry check |
| ASSUME-SEO-005 | The 25-page inventory of the Phase 1.1 task brief equals the future Phase 0 inventory | Phase 0 halted; brief list consistent with MASTER-PROMPT §5 verticals | Diff against `docs/audits/phase0-page-inventory.md` when signed off |
| ASSUME-SEO-006 | Ratified domains `dzives-cels.lv` / `elu-tee.ee` are registered and controlled by JOL | MASTER-PROMPT §4 lists them; no registry access | Registrar confirmation before LV/EE onboarding |
| ASSUME-SEO-007 | Country SEO config files will be YAML (`seo.yml`) to match existing `compliance.yml`/`liturgical.yml`; README's `seo.json` claim is drift | `countries/*/config/` inspection 2026-08-27 | Fixed at §2.2 step 1 implementation |
| ASSUME-SEO-008 | All 27 EU markets fit the §3.3 rule; split-jurisdiction language edge cases (e.g., Cyprus) resolved per-market at onboarding as config, not code | Google hreflang is a hint; region-tag convention | Per-country onboarding review |
| ASSUME-SEO-009 | `ru` locale demand in LV/EE justifies inclusion at launch | Baltic Russian-speaking minorities; no volume data offline | Search Console data after 6 months; demote to deferred locale if demand absent |

## 7. Exit-criteria self-check

| Exit criterion | Status |
|---|---|
| Every choice cites SEO evidence or an architectural trade-off | §1.2 table, §2.1 weighted matrix, §3 rationale rows, §4–5 source columns |
| Machine-checkable matrix implementable without questions | §2.1 decision matrix, §2.2 checklist, §3.3 numbered rule, §5 builder-status table |
| LV/EE are config-level additions | §2.2 acceptance checklist (zero code steps) |
| Assumption Register present | §6, nine entries |
| No code changes made | Docs-only; verified by `git status` at commit time |

## 8. Compliance note

- **GDPR Art. 9 / tenant non-enumeration** — the URL, sitemap and hreflang
  design never exposes the tenant registry (§2.3); consistent with ADR-001 and
  SOC 2 CC6.1. Structured data never embeds personal data beyond what the
  tenant publishes (SEO.md §Structured data).
- **Deceased-person data** (page 22) — plot/interment data is excluded from
  indexing and JSON-LD; full treatment belongs to the Phase 3 GPS Cemetery Map
  spec; flagged here so no SEO work precedes that privacy review.
- **Donation pages (16–17)** — `DonateAction` omits agent/donor identity;
  donor history is an authenticated, noindex surface; Art. 9 consent and
  retention remain governed by the donation flow spec (Phase 2), not SEO.
- **ePrivacy** — no analytics/tracking technology is introduced by this
  strategy; GBP/tool integrations in §4 require the consent and
  EU-jurisdiction reviews already mandated (MASTER-PROMPT §2.4).
- **PSD2** — untouched; payment boundary remains CLOSED (QODER.md / ADR-005/007).

## 9. Follow-ups (out of scope this commit)

1. DECISION-LOG entry ratifying the ccTLD decision and hub role definition
   (recommended next commit, `docs(compliance)` or per owner preference).
2. README reconciliation for `countries/*/config/seo.json` drift — already
   tracked as O-006.
3. `countries/{lv,ee}/config/seo.yml` + `locale.yml` creation when LV/EE
   onboarding is scheduled (implementation ticket, not strategy).
