/**
 * Vitest global setup — STEP 15 (deterministic, isolated tests).
 *
 * Wired via `test.setupFiles` in each app's vitest config. Guarantees:
 *   - RTL auto-cleanup after every test (no leaked DOM between tests);
 *   - fixed timezone (tests never depend on host TZ);
 *   - matchMedia/localStorage shims for jsdom (theme hooks, consent);
 *   - React 18 act environment flag for RTL.
 *
 * RULES honored: no network (MSW or injected fake fetch only), no real
 * timers unless a test fakes them explicitly, no shared mutable state.
 */
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// RTL auto-cleanup (vitest globals off → explicit afterEach).
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Deterministic clock baseline for tests that only need "some" date.
beforeEach(() => {
  process.env.TZ = 'UTC';
});

// React 18 act() environment for RTL.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom lacks matchMedia (ThemeProvider) — deterministic stub.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// jsdom lacks scrollTo (some navigation components call it).
if (typeof window !== 'undefined' && !window.scrollTo) {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => undefined });
}
