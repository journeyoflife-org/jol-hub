/**
 * Vitest configuration — STEP 15 (template-renderer test tiers).
 *
 * Two runners coexist by design (see frontend/docs/testing.md):
 *   - node:test (`tsx --test`)  — pure logic suites, no DOM (STEP 6–14);
 *   - vitest (this config)      — DOM tiers: component (RTL + jsdom),
 *     integration (route handlers + MSW) and security tests.
 *
 * Coverage measures the DOM/security-critical subset (editor core +
 * components) with v8; pure-logic coverage lives in the node:test suites.
 *
 * Run: `pnpm --filter template-renderer test:vitest`
 *      `pnpm --filter template-renderer test:vitest:coverage`
 */
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';

/**
 * The app tsconfig sets `jsx: preserve` (Next.js owns that transform), and
 * Vite 8 honors the detected tsconfig over `esbuild.tsconfigRaw`. This
 * pre-plugin transforms TSX with the automatic JSX runtime BEFORE import
 * analysis, so tests and workspace .tsx sources compile deterministically.
 */
function tsxJsxTransform(): Plugin {
  return {
    name: 'jol-vitest-tsx-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.(tsx|jsx)$/.test(id.split('?')[0] ?? '')) return null;
      const { transform } = await import('esbuild');
      const result = await transform(code, {
        loader: id.endsWith('.tsx') ? 'tsx' : 'jsx',
        jsx: 'automatic',
        sourcefile: id,
        sourcemap: true,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [tsxJsxTransform()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['@jol-hub/testing/setup'],
    include: ['src/__tests__/vitest/**/*.test.{ts,tsx}'],
    // Workspace packages ship TS source — transform them in-pipeline.
    server: {
      deps: {
        inline: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/testing'],
      },
    },
    // Determinism guards (spec RULES): fail on accidental time/network use.
    hookTimeout: 10_000,
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Security-critical core: the constrained editor (10% control surface).
      include: ['src/lib/editor/**/*.ts', 'src/components/editor/**/*.tsx'],
      exclude: ['**/index.ts', '**/*.d.ts'],
      thresholds: {
        // Ratchet baseline — measured 2026-08-25 (101 tests). lib/editor
        // (the security core) sits at ~85%+; raise, never lower.
        lines: 65,
        functions: 50,
        branches: 55,
        statements: 60,
      },
    },
  },
});
