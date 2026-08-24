/**
 * FocusTrap — keyboard focus containment for dialogs/drawers (WCAG 2.1.2,
 * 2.4.3). Native refs only — no external a11y dependencies.
 *
 * Behavior:
 * - On activation, moves focus to the first focusable descendant
 *   (or the container itself when none exist).
 * - Tab / Shift+Tab cycle stays inside the trap.
 * - Escape delegates to `onEscape`.
 * - On deactivation/unmount, restores focus to the previously focused
 *   element (or `restoreFocusTo`).
 */
'use client';

import { useEffect, useRef } from 'react';

import type { FocusTrapProps } from './FocusTrap.types';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function FocusTrap({
  children,
  active = true,
  onEscape,
  restoreFocusTo,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current =
      restoreFocusTo ?? (document.activeElement as HTMLElement | null);

    const focusables = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );

    const initial = focusables()[0] ?? container;
    initial.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0] ?? container;
      const last = items[items.length - 1] ?? container;
      const current = document.activeElement;

      if (event.shiftKey && (current === first || current === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      const restoreTo = restoreFocusTo ?? previouslyFocused.current;
      if (restoreTo && document.contains(restoreTo)) {
        restoreTo.focus();
      }
    };
  }, [active, onEscape, restoreFocusTo]);

  return (
    <div ref={containerRef} tabIndex={active ? -1 : undefined}>
      {children}
    </div>
  );
}
