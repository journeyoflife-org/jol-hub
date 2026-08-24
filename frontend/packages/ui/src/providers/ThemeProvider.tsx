/**
 * JOL Design System — theme provider.
 *
 * - Preferences: `'light' | 'dark' | 'system'` (default: `'system'`).
 * - Persisted to `localStorage` under `jol-theme-preference`.
 * - Applies the `dark` class to `document.documentElement`
 *   (`darkMode: 'class'` in Tailwind).
 * - No FOUT: pair this provider with `THEME_INIT_SCRIPT` inlined in the
 *   document `<head>`/`<body>` before first paint (see template-renderer
 *   root layout).
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'jol-theme-preference';

/**
 * Inline (pre-hydration) script that applies the persisted theme before
 * first paint. Safe to embed verbatim: no external references, wrapped in
 * try/catch so private-browsing storage failures degrade to system theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||((!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);}catch(e){}})();`;

interface ThemeContextValue {
  /** Stored user preference. */
  theme: ThemePreference;
  /** Effective mode after resolving `'system'`. */
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
  /** Convenience toggle: light ↔ dark (pins the choice, leaves `'system'`). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Storage unavailable (private mode, blocked) — fall back silently.
  }
  return 'system';
}

function applyClass(resolved: ResolvedTheme): void {
  const classList = document.documentElement.classList;
  classList.toggle('dark', resolved === 'dark');
  classList.toggle('light', resolved === 'light');
}

export function ThemeProvider({
  children,
  defaultPreference = 'system',
}: {
  children: React.ReactNode;
  defaultPreference?: ThemePreference;
}) {
  const [theme, setThemeState] = useState<ThemePreference>(defaultPreference);
  const [systemDark, setSystemDark] = useState(false);

  // Hydration-safe initialization.
  useEffect(() => {
    setThemeState(readStoredPreference());
    setSystemDark(systemPrefersDark());
  }, []);

  // Track OS preference while in `'system'` mode.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent): void => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Apply the class whenever the resolved mode changes.
  useEffect(() => {
    applyClass(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((preference: ThemePreference) => {
    setThemeState(preference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Non-fatal: preference applies for this session only.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return context;
}
