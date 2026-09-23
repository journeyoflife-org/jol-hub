---
'@journeyoflife-org/i18n': minor
---

Add `resolveLocale`, `LocalizedText` and `TODO_MARKER` for inline localized-field resolution.

Spoke tenant fixtures (`tenant.json`, seed-data) carry translations inline as
`{ lt, en?, ru? }` objects, which the message-catalog pipeline (`getMessages` /
`translate`) does not cover — catalogs map translation KEYS to ICU strings.
`resolveLocale(text, locale)` resolves such an object to a string.

Fallback policy (Phase 3 spec S3.2 Step 4): `lt` is the mandatory source
language. An exact match is returned verbatim; otherwise the `lt` value is
used, and when that value still carries `TODO_MARKER` a visible
`[XX translation pending] ...` placeholder is returned so a missing
translation can never degrade silently.

Also:

- Adds a `test` script (`tsx --test src/__tests__/*.test.ts`) and wires it into
  `verify`. The package previously shipped unit tests that no script executed.
- Adds `locale-parity` tests pinning `SUPPORTED_LOCALES` as the single source
  of truth for the locale maps, and keeping `PLANNED_LOCALES` disjoint from it.
- Sets `PLANNED_LOCALES` to `[]`. `pl` was listed there as "planned" while
  already being declared in `SUPPORTED_LOCALES` — a contradiction. `PlannedLocale`
  therefore becomes `never` and `LocaleCode` collapses to `SupportedLocale`.
- Corrects documentation that had drifted from the code: `FALLBACK_ORDER` is
  LT-first (`lt, en, ru`), not `ru → en → lt`; `getLocaleFromPath` derives its
  pattern from `SUPPORTED_LOCALES` rather than a hardcoded `lt|ru|en`; and the
  README no longer states that `pl` is disabled.

RELEASE NOTE — read before publishing. Two pre-existing conditions ship with
this version and are NOT introduced by it:

1. The published `1.0.0` artifact declares `SupportedLocale = 'lt' | 'ru' | 'en'`,
   while source already declares `'lt' | 'ru' | 'en' | 'pl'` (Wave 1 Task 6).
   Any publish from current source therefore widens the locale union for every
   consumer on `^1.0.0`.
2. `pnpm verify` is currently RED independent of this change:
   `scripts/check-parity.ts` reports ~364 problems, almost all `pl` —
   `pl.json` is not wired into `CATALOGS`, its key set does not match the
   reference locale, and `verticals/{church,funeral,cleaning}.json` have no `pl`
   section. `@journeyoflife-org/seed-data` also still defines
   `LocalizedTextSchema` as 3-locale, so fixtures cannot carry `pl` content.

`release.yml` runs `pnpm build:packages` (not `verify`), so publishing is not
blocked by (2) — but `pl` should be either completed or gated out deliberately
before it reaches production spokes. See README "Poland (pl)".
