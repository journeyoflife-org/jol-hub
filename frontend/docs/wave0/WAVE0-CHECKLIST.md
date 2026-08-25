# Wave 0 — Pre-launch Checklist & Go-live Procedure

The gate between "built" and "shown to a bishop". Every box requires an
initial + date in the change log (SOC 2 CC8.1 / ISO 27001 A.8.32).

## A. Rendering & devices

- [ ] All 5 sites render on mobile / tablet / desktop
      (`siauliai-diocese`, `siauliai-church`, `siauliai-funeral`,
      `siauliai-cleaning`, `kraziai-church`)
- [ ] Locale switcher works LT → EN → RU on each site
- [ ] No console errors on any reference route

## B. Performance

- [ ] Lighthouse ≥ 90 (mobile) on all 5 sites — needs a Chrome-equipped
      machine (`lighthouserc.js` config ready; offline host runs the byte
      budget gate instead)
- [ ] Core Web Vitals green (LCP < 2.5 s, CLS < 0.1, INP < 200 ms)
- [ ] Budget gate: worst route < 200 KiB gz (`pnpm check-perf`)

## C. Functionality

- [ ] Contact forms submit (Bitrix24 TEST pipeline) on all 5 sites
- [ ] Booking widget works in test mode on funeral + cemetery-care sites
- [ ] Donation surface shows the honest pending-payments notice (ADR-007)
      — NO fake checkout anywhere (PCI-DSS: test mode until SAQ A)
- [ ] Auth flow works for the test admin account (once jol-auth is live;
      until then OPEN MODE is documented per site)

## D. SEO & accessibility

- [ ] Structured data validates (Google Rich Results test) for all 5
- [ ] Sitemaps submitted for each domain
- [ ] axe-core passes on every route (`pnpm test:a11y`)
- [ ] Keyboard-only navigation walk-through per site

## E. Security & compliance

- [ ] No secrets in build output (`pnpm check-secrets`)
- [ ] Security headers present (X-Frame-Options, nosniff, Referrer-Policy)
- [ ] CSP active at the edge (jol-infrastructure nginx template)
- [ ] Privacy policy, cookie banner and terms render on every tenant
- [ ] Demo data confirmed anonymized — NEVER real donor/sacramental data

## F. Operations

- [ ] `/api/health` returns 200 on production and staging
- [ ] Alerting rules loaded (observability/alert-rules.yml)
- [ ] Grafana dashboard imported (observability/grafana-dashboard.json)
- [ ] Retention classes configured in Loki (90 d / 1 y / 7 y)
- [ ] VM snapshot taken immediately before go-live (vzdump)
- [ ] Rollback rehearsed on staging (`scripts/rollback.sh`)

## G. Staging gate (pre-production, BLOCKING)

- [ ] Staging mirrors production config (`.env.staging` from Vault)
- [ ] ALL test tiers pass on staging: unit, integration, security, E2E
- [ ] Staging signed off by dev + ops + diocese contact

## Go-live procedure (TASK 10)

| # | Step | Owner |
| --- | --- | --- |
| 1 | Confirm low-traffic window (early morning) with the Diocese | JOL ops |
| 2 | Team check: JOL dev, JOL ops, Diocese contact on the bridge | JOL ops |
| 3 | VM snapshot (`vzdump`) — recorded in change log | JOL ops |
| 4 | `scripts/deploy.sh --env production --confirm-snapshot` | JOL dev |
| 5 | Verify health + smoke (script does this; confirm on dashboards) | JOL dev |
| 6 | Walk all 5 sites on mobile + desktop | Diocese contact |
| 7 | **Monitor 2 hours** — error rate, health, CWV dashboards | JOL ops |
| 8 | Announce to stakeholders; open feedback channel | JOL dev |
| 9 | File GitHub issues for anything observed (label `wave0`) | JOL dev |

**Abort rule:** any P0 alert or failed smoke test → `scripts/rollback.sh`
immediately, then restore snapshot if rollback health check fails. No
forward-fixing during the presentation window. Full severity-graded
procedure: [EMERGENCY-ROLLBACK.md](./EMERGENCY-ROLLBACK.md) (Appendix B).
