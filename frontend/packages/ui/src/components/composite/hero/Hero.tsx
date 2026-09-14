/**
 * Hero — page-top banner with a single, semantic `<h1>`.
 *
 * Vertical variants:
 * - `church`  — warm overlay with optional liturgical-gold accent rule
 * - `funeral` — restrained stone palette, dignified spacing
 * - `cleaning`/`default` — bright, high-contrast surfaces
 *
 * Images require explicit `width`/`height` (CLS prevention). Background
 * images are decorative (`alt=""`) unless alt text is supplied.
 */
import { cn } from '../../../lib/utils';
import { accentTextClass, isMemorialVertical, isSacredVertical, type TenantTheme } from '../../../lib/tenant-theme';
import type { HeroCta, HeroProps, HeroVariant } from './Hero.types';

const OVERLAYS: Record<number, string> = {
  0: 'bg-transparent',
  10: 'bg-neutral-950/10',
  20: 'bg-neutral-950/20',
  30: 'bg-neutral-950/30',
  40: 'bg-neutral-950/40',
  50: 'bg-neutral-950/50',
  60: 'bg-neutral-950/60',
  70: 'bg-neutral-950/70',
  80: 'bg-neutral-950/80',
  90: 'bg-neutral-950/90',
};

function deriveVariant(variant: HeroVariant | undefined, tenant?: TenantTheme): HeroVariant {
  if (variant) return variant;
  if (isMemorialVertical(tenant)) return 'funeral';
  if (isSacredVertical(tenant)) return 'church';
  return 'default';
}

function ctaClass(cta: HeroCta, resolved: HeroVariant): string {
  const base =
    'inline-flex h-12 items-center justify-center rounded-md px-6 text-base font-medium focus-ring transition-colors motion-reduce:transition-none';
  if (cta.emphasis === 'secondary') {
    return cn(base, 'border-2 border-current bg-transparent hover:bg-neutral-50/10');
  }
  return cn(
    base,
    resolved === 'funeral'
      ? 'bg-stone-700 text-neutral-50 hover:bg-stone-800'
      : 'bg-primary text-neutral-50 hover:bg-primary-700',
  );
}

export function Hero({
  title,
  subtitle,
  background,
  overlayOpacity = 50,
  ctaButtons = [],
  variant,
  tenant,
  align = 'center',
  className,
}: HeroProps) {
  const resolved = deriveVariant(variant, tenant);

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden',
        resolved === 'funeral' ? 'bg-stone-100 dark:bg-stone-950' : 'bg-primary-900',
        className,
      )}
    >
      {background?.kind === 'image' && (
        <img
          src={background.src}
          width={background.width}
          height={background.height}
          alt={background.alt ?? ''}
          aria-hidden={background.alt ? undefined : true}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      {background?.kind === 'image' && (
        <div aria-hidden="true" className={cn('absolute inset-0 -z-10', OVERLAYS[overlayOpacity])} />
      )}
      {background?.kind === 'color' && background.className && (
        <div aria-hidden="true" className={cn('absolute inset-0 -z-10', background.className)} />
      )}

      <div
        className={cn(
          'container mx-auto flex flex-col gap-4 px-4 py-16 md:py-24',
          align === 'center' ? 'items-center text-center' : 'items-start text-start',
        )}
      >
        <h1
          className={cn(
            'font-heading text-4xl font-bold md:text-5xl',
            background?.kind === 'image' || background?.kind === 'color'
              ? 'text-neutral-50'
              : resolved === 'funeral'
                ? 'text-stone-900 dark:text-stone-100'
                : 'text-neutral-50',
          )}
        >
          {title}
        </h1>
        {resolved === 'church' && (
          <div aria-hidden="true" className={cn('h-1 w-24 rounded-full bg-liturgical-gold')} />
        )}
        {subtitle && (
          <p
            className={cn(
              'max-w-2xl text-lg',
              background?.kind ? 'text-neutral-100' : 'text-neutral-600 dark:text-neutral-300',
            )}
          >
            {subtitle}
          </p>
        )}
        {ctaButtons.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {ctaButtons.map((cta) => (
              <a key={cta.href} href={cta.href} className={ctaClass(cta, resolved)}>
                <span className={cta.emphasis === 'secondary' ? accentTextClass(tenant) : undefined}>
                  {cta.label}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
