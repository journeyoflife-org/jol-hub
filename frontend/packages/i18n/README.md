# @jol-hub/i18n

Internationalization for the JOL multi-tenant platform — STEP 4.

**Pilot locales:** Lithuanian (`lt`, primary/default), English (`en`),
Russian (`ru`). **Horizon:** 27 EU locales without redesign — adding a
locale is a data change (one message file + one array entry), never a
routing or component change.

## Routing strategy (decision)

**Chosen: locale-prefixed paths** — `/{locale}/{tenant}/{slug}`
(e.g. `/en/parish-st-john-vilnius/news`).

Option A (`{locale}.{tenant}.gyvenimo-kelias.lt`) is **also implemented as
a detection strategy** (middleware reads the left-most subdomain label),
and remains a viable future canonical form; both resolution strategies are
live per the STEP 4 requirement. Path prefixes were chosen as the
canonical URL shape because:

- One domain per tenant keeps DNS/TLS/certificate management flat while
  the platform scales to 27 locales × N tenants.
- hreflang is equally expressible either way; we emit `lt-LT`/`en-LT`/
  `ru-LT` + `x-default` alternates per page and a per-tenant sitemap.
- Cookie/header negotiation produces one redirect to the canonical
  prefixed URL; afterwards the URL is authoritative.

## Detection priority (unprefixed URLs → 307 to canonical)

1. **Subdomain prefix** — `en.tenant.domain` (explicit URL)
2. **Cookie** `jol-hub-locale` (persisted explicit choice)
3. **`?locale=` param** (explicit one-shot; persisted into the cookie)
4. **`Accept-Language` header** (implicit negotiation)
5. **`lt`** (default)

Unknown locale codes never 404: they fall back `ru → en → lt` with a
warning logged (config `FALLBACK_ORDER` documents the chain).

The resolved locale is exposed downstream via the `x-locale` request
header (root layout sets `<html lang>`; server components read it).

## Message pipeline

```
messages/{lt,en,ru}.json          common catalog (96 keys)
messages/verticals/{church,funeral,cleaning}.json   vertical overrides
tenant fixture overrides          (optional, merged last)
        │  deep merge, last wins
        ▼
TranslationProvider (locale + merged catalog via React context)
        ▼
useTranslations(ns) → t(key, values)   ICU interpolation + pluralization
useLocale() → locale, direction, Intl formatters
```

- **ICU MessageFormat** (`intl-messageformat`) for interpolation and
  pluralization — Russian `few` forms are handled correctly.
- Server components use `getMessages(locale, { vertical })` +
  `translate()` / `IntlMessageFormat` directly (no hooks).
- Vertical overrides may only REPLACE existing keys (enforced by
  `pnpm i18n:check`).

## Formatting

`utils.ts` / `useLocale()` — all dates, numbers and currency go through
`Intl` with canonical region tags (`lt-LT`, `en-GB`, `ru-RU`). Currency is
EUR platform-wide in the pilot, formatted per locale
(`1 234,56 €` / `€1,234.56`). RTL: `direction` is plumbed through the
context and CSS logical properties are used across the design system; the
pilot locales are all LTR.

## SEO

- `<link rel="alternate" hreflang="...">` + `x-default` via Next metadata
  `alternates.languages` on every tenant page.
- **Per-tenant sitemap** (`app/sitemap.ts`): emitted only when a tenant is
  resolved for the request. There is deliberately **no hub-level sitemap**
  (GDPR Art. 9 / SOC 2 CC6.1 — tenant enumeration).

## Enforcement (CI gates)

- `pnpm i18n:check` — key parity across locales + verticals; overrides may
  not invent keys.
- `pnpm i18n:find-hardcoded` — scans the shared library
  (`packages/ui/src/components/{primitives,composite,layout,accessibility,
  locale-switcher}`, `src/lib`) and `apps/template-renderer/src` for
  user-visible string literals; fails on any finding.
  - Excluded by design: `dev/` surfaces (sample tenant content),
    `*.types.ts`, and LEGACY flat components in
    `packages/ui/src/components/*.{tsx}` (deprecated parish-template /
    master-site surfaces, removed with those apps per ADR-002).

## Poland (pl)

OPEN QUESTION. `PLANNED_LOCALES = ['pl']` marks the extension point; it is
**disabled** (not in `SUPPORTED_LOCALES`, no messages, no routing).

## Legacy surface

The i18next-based runtime (`i18next.ts`, `locales/`, `I18nProvider`,
`LanguageSwitcher`, DeepL hooks) is retained for the parish-template app
and is frozen; new code uses the ICU pipeline above.
