/**
 * Announcer — app-wide live-region announcements.
 *
 * Wrap the app once in `<AnnouncerProvider>`; anywhere below, call
 * `useAnnounce().announcePolite('…')` to speak status changes (form
 * results, loading completion, route changes) without stealing focus.
 *
 * Route-change announcements: apps should call `announcePolite` from a
 * `usePathname()` effect (kept app-side so this package stays
 * framework-agnostic — no `next/*` imports here).
 */
'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { LiveRegion } from '../live-region';
import type { AnnouncerProviderProps, AnnounceApi } from './Announcer.types';

interface AnnouncerState {
  polite: string;
  assertive: string;
}

const AnnouncerContext = createContext<AnnounceApi | null>(null);

export function AnnouncerProvider({ children }: AnnouncerProviderProps) {
  const [state, setState] = useState<AnnouncerState>({ polite: '', assertive: '' });

  const announcePolite = useCallback((message: string) => {
    // Clear then set on next tick so identical consecutive messages
    // still re-announce (assistive tech ignores unchanged text nodes).
    setState((previous) => ({ ...previous, polite: '' }));
    setTimeout(() => setState((previous) => ({ ...previous, polite: message })), 50);
  }, []);

  const announceAssertive = useCallback((message: string) => {
    setState((previous) => ({ ...previous, assertive: '' }));
    setTimeout(() => setState((previous) => ({ ...previous, assertive: message })), 50);
  }, []);

  const api = useMemo(
    () => ({ announcePolite, announceAssertive }),
    [announcePolite, announceAssertive],
  );

  return (
    <AnnouncerContext.Provider value={api}>
      {children}
      <LiveRegion politeness="polite" message={state.polite} />
      <LiveRegion politeness="assertive" message={state.assertive} />
    </AnnouncerContext.Provider>
  );
}

/** Access the announcement API. Throws outside `<AnnouncerProvider>`. */
export function useAnnounce(): AnnounceApi {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnounce must be used within an <AnnouncerProvider>');
  }
  return context;
}
