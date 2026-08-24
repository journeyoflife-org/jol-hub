/**
 * Header — site chrome: logo, MainNav, actions, mobile drawer.
 *
 * - `sticky` by default; `transparentOnScroll` starts transparent and
 *   becomes solid after 24px of scroll.
 * - The hamburger trigger opens {@link MobileNav} (focus-trapped).
 * - Pair with {@link SkipLink} rendered BEFORE this component so skip is
 *   the first focusable element.
 */
'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { MainNav } from '../main-nav';
import { MobileNav } from '../mobile-nav';
import type { HeaderProps } from './Header.types';

const SCROLL_THRESHOLD_PX = 24;

export function Header({
  logo,
  navItems,
  actions,
  sticky = true,
  transparentOnScroll = false,
  className,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!transparentOnScroll) return;
    const onScroll = (): void => setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentOnScroll]);

  const solid = !transparentOnScroll || scrolled;

  return (
    <>
      <header
        className={cn(
          'z-40 w-full transition-colors motion-reduce:transition-none',
          sticky && 'sticky top-0',
          solid ? 'bg-primary text-neutral-50 shadow-md' : 'bg-transparent text-neutral-50',
          className,
        )}
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="font-heading text-xl font-bold">{logo}</div>

          <MainNav items={navItems} className="hidden md:block" />

          <div className="flex items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label="Atidaryti meniu / Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-primary-700 focus-ring md:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-nav-drawer">
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} items={navItems} />
      </div>
    </>
  );
}
