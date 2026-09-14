/**
 * Page-level WCAG 2.2 AA gate — STEP 12.
 *
 * Fetches the CRITICAL tenant pages from a running renderer, strips the
 * hydration scripts (axe audits the semantic DOM; React hydration in jsdom
 * is noise) and runs the full audit suite from `@jol-hub/a11y`:
 *   - axe-core with the WCAG 2.0–2.2 A+AA tag set (color-contrast disabled
 *     under jsdom — enforced at token level instead; see axe-config.ts);
 *   - structural checkers: heading hierarchy, alt text, focus order,
 *     form labels, ARIA usage, banned link text.
 *
 * Exits non-zero on any FAIL — wire into CI after `next build && next start`.
 *
 * PERFORMANCE (spec): critical pages only. Component coverage comes from
 * the ui showcase gate (`packages/ui: pnpm check-a11y`).
 *
 * E2E NOTE: Playwright is not available in this offline workspace; user-flow
 * audits (login, booking, donation, contact) are covered by the manual
 * checklist in `frontend/docs/a11y-audit.md` until the harness lands. The
 * a11y package's `buildAxeOptions({ browserHarness: true })` is the
 * integration point.
 *
 * Run: `pnpm --filter template-renderer check-a11y`
 *   env A11Y_BASE_URL (default http://localhost:3000)
 *   env A11Y_TENANT   (default parish-st-john-vilnius)
 */
import { auditHtml, formatReport, hasFailures, type A11yReport } from '@jol-hub/a11y';

const BASE_URL = process.env.A11Y_BASE_URL ?? 'http://localhost:3000';
const TENANT = process.env.A11Y_TENANT ?? 'parish-st-john-vilnius';

/** Critical pages (spec coverage list, minus flows needing a live backend). */
const CRITICAL_ROUTES: readonly string[] = [
  '', // home
  '/about',
  '/contact',
  '/news',
  '/events',
  '/services',
  '/accessibility-statement',
];

/**
 * Strip <script> payloads: axe audits the semantic document, and executing
 * Next hydration scripts inside jsdom is slow and flaky.
 */
function stripScripts(html: string): string {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
}

async function fetchPage(route: string): Promise<string> {
  const url = `${BASE_URL}/lt/${TENANT}${route}`;
  const response = await fetch(url, {
    headers: {
      'x-tenant': TENANT,
      // Production HTTPS enforcement — the app redirects without it.
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'a11y-audit.local',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`GET ${url} → HTTP ${response.status}`);
  }
  return stripScripts(await response.text());
}

async function main(): Promise<void> {
  console.log(`a11y page gate — ${BASE_URL} (tenant: ${TENANT})`);
  console.log('='.repeat(78));

  const reports: A11yReport[] = [];
  for (const route of CRITICAL_ROUTES) {
    const html = await fetchPage(route);
    const report = await auditHtml(html, { target: `/lt/${TENANT}${route}` });
    reports.push(report);
    const status = hasFailures(report) ? 'FAIL' : 'ok';
    console.log(
      `[${status}] ${report.target.padEnd(44)} axe:${report.axePasses} rules, ` +
        `${report.violations.length} violation(s), ${report.warnings.length} warning(s)`,
    );
  }

  console.log('='.repeat(78));
  const failing = reports.filter(hasFailures);
  if (failing.length > 0) {
    for (const report of failing) {
      console.error(`\n${formatReport(report)}`);
    }
    console.error(`\n${failing.length}/${reports.length} page(s) violate WCAG 2.2 AA.`);
    process.exit(1);
  }

  const warnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);
  console.log(`0 violations across ${reports.length} critical page(s)${warnings ? ` (${warnings} warning(s) — review)` : ''}.`);
}

main().catch((error) => {
  console.error('a11y page gate crashed (is the server running?):', error);
  process.exit(1);
});
