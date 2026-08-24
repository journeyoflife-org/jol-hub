/**
 * Tenant-aware theming helpers.
 *
 * Components accept a `tenant` prop and derive vertical-specific accent
 * classes from the design-system `vertical.*` color utilities (STEP 2
 * tokens — no hex values anywhere in components).
 */
import type { VerticalAccentName } from '../tokens/colors';

/** Tenant theming context passed to components. */
export interface TenantTheme {
  /** Tenant vertical — drives accent colors and composite variants. */
  vertical?: VerticalAccentName;
}

const ACCENT_TEXT: Record<VerticalAccentName, string> = {
  parish: 'text-vertical-parish',
  basilica: 'text-vertical-basilica',
  cathedral: 'text-vertical-cathedral',
  chapel: 'text-vertical-chapel',
  monastery: 'text-vertical-monastery',
  diocese: 'text-vertical-diocese',
  deanery: 'text-vertical-deanery',
  cemetery: 'text-vertical-cemetery',
  'funeral-home': 'text-vertical-funeral-home',
  'orthodox-church': 'text-vertical-orthodox-church',
  'greek-catholic': 'text-vertical-greek-catholic',
  'protestant-church': 'text-vertical-protestant-church',
};

const ACCENT_BG: Record<VerticalAccentName, string> = {
  parish: 'bg-vertical-parish',
  basilica: 'bg-vertical-basilica',
  cathedral: 'bg-vertical-cathedral',
  chapel: 'bg-vertical-chapel',
  monastery: 'bg-vertical-monastery',
  diocese: 'bg-vertical-diocese',
  deanery: 'bg-vertical-deanery',
  cemetery: 'bg-vertical-cemetery',
  'funeral-home': 'bg-vertical-funeral-home',
  'orthodox-church': 'bg-vertical-orthodox-church',
  'greek-catholic': 'bg-vertical-greek-catholic',
  'protestant-church': 'bg-vertical-protestant-church',
};

const ACCENT_BORDER: Record<VerticalAccentName, string> = {
  parish: 'border-vertical-parish',
  basilica: 'border-vertical-basilica',
  cathedral: 'border-vertical-cathedral',
  chapel: 'border-vertical-chapel',
  monastery: 'border-vertical-monastery',
  diocese: 'border-vertical-diocese',
  deanery: 'border-vertical-deanery',
  cemetery: 'border-vertical-cemetery',
  'funeral-home': 'border-vertical-funeral-home',
  'orthodox-church': 'border-vertical-orthodox-church',
  'greek-catholic': 'border-vertical-greek-catholic',
  'protestant-church': 'border-vertical-protestant-church',
};

/** Accent text color class for a tenant (falls back to primary). */
export function accentTextClass(tenant?: TenantTheme): string {
  return tenant?.vertical ? ACCENT_TEXT[tenant.vertical] : 'text-primary';
}

/** Accent background class for a tenant (falls back to primary). */
export function accentBgClass(tenant?: TenantTheme): string {
  return tenant?.vertical ? ACCENT_BG[tenant.vertical] : 'bg-primary';
}

/** Accent border class for a tenant (falls back to primary). */
export function accentBorderClass(tenant?: TenantTheme): string {
  return tenant?.vertical ? ACCENT_BORDER[tenant.vertical] : 'border-primary';
}

/** True for memorial verticals (subdued, dignified treatment). */
export function isMemorialVertical(tenant?: TenantTheme): boolean {
  return tenant?.vertical === 'cemetery' || tenant?.vertical === 'funeral-home';
}

/** True for sacred/church verticals (warm, gold-accented treatment). */
export function isSacredVertical(tenant?: TenantTheme): boolean {
  switch (tenant?.vertical) {
    case 'parish':
    case 'basilica':
    case 'cathedral':
    case 'chapel':
    case 'monastery':
    case 'orthodox-church':
    case 'greek-catholic':
    case 'protestant-church':
      return true;
    default:
      return false;
  }
}
