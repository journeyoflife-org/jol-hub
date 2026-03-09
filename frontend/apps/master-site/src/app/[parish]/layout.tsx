/**
 * Dynamic parish layout for multi-tenant JOL-HUB.
 * 
 * This layout is used for all parish subdomain routes.
 * It fetches parish configuration, applies themes, and provides
 * the ParishProvider context.
 * 
 * PERFORMANCE:
 * - Static generation with ISR (1 hour revalidation)
 * - 5-minute cache for parish config
 * - Edge Runtime compatible
 */

import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { resolveParish } from '@/lib/tenant/resolver';
import { getCurrentLiturgicalSeason, type ParishConfig } from '@/lib/tenant/config';
import { ParishProvider } from '@/components/tenant/ParishProvider';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Layout props interface.
 */
interface ParishLayoutProps {
  /** Child components */
  children: ReactNode;
  /** Route parameters */
  params: {
    /** Parish subdomain */
    parish: string;
  };
}

// =============================================================================
// METADATA GENERATION
// =============================================================================

/**
 * Generates metadata for the parish page.
 * 
 * @param props - Layout props with params
 * @returns Metadata object
 */
export async function generateMetadata(
  props: ParishLayoutProps
): Promise<Metadata> {
  const { params } = props;
  const parish = await resolveParish(params.parish);

  if (!parish) {
    return {
      title: 'Parish Not Found | JOL-HUB',
      description: 'The requested parish could not be found.',
    };
  }

  const season = getCurrentLiturgicalSeason();
  const seasonEmoji = getSeasonEmoji(season);

  return {
    title: {
      default: `${parish.name} ${seasonEmoji} | JOL-HUB`,
      template: `%s | ${parish.name} | JOL-HUB`,
    },
    description: parish.description ?? `Welcome to ${parish.name}. Find mass schedules, announcements, and parish information.`,
    keywords: [
      parish.name,
      'Catholic',
      'Parish',
      'Lithuania',
      'Mass Schedule',
      parish.diocese?.shortName ?? '',
      parish.patronSaint ?? '',
    ].filter(Boolean),
    authors: [{ name: parish.name }],
    creator: parish.name,
    publisher: 'JOL-HUB',
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      locale: parish.language.replace('-', '_'),
      siteName: `${parish.name} | JOL-HUB`,
      title: parish.name,
      description: parish.description ?? `Welcome to ${parish.name}`,
      images: parish.coverPhotoUrl ? [parish.coverPhotoUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: parish.name,
      description: parish.description ?? `Welcome to ${parish.name}`,
      images: parish.coverPhotoUrl ? [parish.coverPhotoUrl] : undefined,
    },
    alternates: {
      canonical: `https://${parish.subdomain}.jol-hub.eu`,
    },
  };
}

/**
 * Generates viewport configuration.
 */
export async function generateViewport(
  props: ParishLayoutProps
): Promise<Viewport> {
  const { params } = props;
  const parish = await resolveParish(params.parish);

  return {
    themeColor: parish?.theme.primaryColor ?? '#00843D',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  };
}

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

/**
 * Parish layout component.
 * 
 * Fetches parish configuration and wraps children with:
 * - Theme CSS variables
 * - ParishProvider context
 * - Error handling (404 if parish not found)
 * 
 * @param props - Layout props
 * @returns JSX element
 */
export default async function ParishLayout(
  props: ParishLayoutProps
): Promise<JSX.Element> {
  const { children, params } = props;

  // Fetch parish configuration
  const parish = await resolveParish(params.parish);

  // If parish not found, show 404
  if (!parish) {
    notFound();
  }

  // Generate CSS variables from theme
  const themeStyles = generateThemeStyles(parish);

  return (
    <div
      className={`parish-theme-${parish.theme.id} min-h-screen`}
      style={themeStyles}
      data-parish-id={parish.id}
      data-parish-subdomain={parish.subdomain}
      data-diocese-id={parish.dioceseId}
    >
      <ParishProvider parish={parish}>
        {children}
      </ParishProvider>
    </div>
  );
}

// =============================================================================
// STATIC GENERATION
// =============================================================================

/**
 * Static params for all mock parishes.
 * 
 * In production, this should fetch from API/Redis.
 */
export async function generateStaticParams(): Promise<Array<{ parish: string }>> {
  // Mock parishes for static generation
  const parishes = [
    'stmarys',
    'stjohn',
    'stjoseph',
    'stpeter',
    'stanne',
    'holy-cross',
    'st-francis',
    'st-therese',
    'divine-mercy',
    'sacred-heart',
  ];

  return parishes.map((parish) => ({
    parish,
  }));
}

/**
 * Revalidation period for ISR (1 hour).
 */
export const revalidate = 3600;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generates CSS custom properties from parish theme.
 */
function generateThemeStyles(parish: ParishConfig): React.CSSProperties {
  const { theme } = parish;

  return {
    '--parish-primary': theme.primaryColor,
    '--parish-secondary': theme.secondaryColor,
    '--parish-accent': theme.accentColor,
    '--parish-heading-font': theme.headingFont,
    '--parish-body-font': theme.bodyFont,
    // Additional theme variables
    '--parish-id': parish.id,
    '--parish-subdomain': parish.subdomain,
    ...theme.customCss,
  } as React.CSSProperties;
}

/**
 * Gets emoji for current liturgical season.
 */
function getSeasonEmoji(season: string): string {
  const emojis: Record<string, string> = {
    advent: '🕯️',
    christmas: '⭐',
    ordinary_time: '🌿',
    lent: '✝️',
    holy_week: '✝️',
    easter: '🌅',
    pentecost: '🔥',
  };
  return emojis[season] ?? '🌿';
}
