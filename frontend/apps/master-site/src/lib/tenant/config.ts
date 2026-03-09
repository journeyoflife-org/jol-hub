/**
 * Multi-tenant configuration types for JOL-HUB parish subdomains.
 * 
 * Supports 400,000+ parish subdomains with:
 * - Type-safe configuration objects
 * - Diocese hierarchy
 * - Theme and localization support
 * - Data isolation guarantees
 */

// =============================================================================
// DIOCESE CONFIGURATION
// =============================================================================

/**
 * Diocese configuration for hierarchical organization.
 * Each diocese contains multiple parishes under its jurisdiction.
 */
export interface DioceseConfig {
  /** Unique diocese identifier */
  id: string;
  /** Diocese name (e.g., "Archdiocese of Vilnius") */
  name: string;
  /** Short name for display (e.g., "Vilnius") */
  shortName: string;
  /** Current bishop's name */
  bishopName: string;
  /** Bishop's title (e.g., "Archbishop", "Bishop") */
  bishopTitle: string;
  /** Cathedral parish ID */
  cathedralId: string;
  /** Timezone for the diocese */
  timezone: string;
  /** Country code */
  countryCode: string;
  /** Diocese website URL */
  website?: string;
  /** Diocese contact email */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Address */
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

// =============================================================================
// PARISH CONFIGURATION
// =============================================================================

/**
 * Theme configuration for parish customization.
 */
export interface ParishTheme {
  /** Theme identifier */
  id: 'default' | 'modern' | 'traditional' | 'minimal';
  /** Primary color (hex) */
  primaryColor: string;
  /** Secondary color (hex) */
  secondaryColor: string;
  /** Accent color (hex) */
  accentColor: string;
  /** Font family for headings */
  headingFont: string;
  /** Font family for body text */
  bodyFont: string;
  /** Custom CSS variables */
  customCss?: Record<string, string>;
}

/**
 * Service time configuration.
 */
export interface ServiceTime {
  /** Day of week (0 = Sunday, 1 = Monday, etc.) */
  dayOfWeek: number;
  /** Day name for display */
  dayName: string;
  /** Time in HH:MM format */
  time: string;
  /** Service type (e.g., "Mass", "Confession", "Adoration") */
  type: 'mass' | 'confession' | 'adoration' | 'vespers' | 'other';
  /** Language of the service */
  language: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Contact information for parish.
 */
export interface ParishContact {
  /** Primary phone number */
  phone?: string;
  /** Secondary phone number */
  phoneSecondary?: string;
  /** Email address */
  email?: string;
  /** Website URL */
  website?: string;
  /** Physical address */
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    /** Geographic coordinates */
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Parish configuration for multi-tenant routing.
 * 
 * This is the core configuration object that defines a parish's
 * identity, appearance, and operational settings.
 */
export interface ParishConfig {
  // Identity
  /** Unique parish identifier (Bitrix24 department ID) */
  id: string;
  /** Parish name (e.g., "St. Mary's Parish") */
  name: string;
  /** URL-friendly subdomain (e.g., "stmarys-kaunas") */
  subdomain: string;
  /** Alternative names/aliases */
  aliases?: string[];
  /** Parish description */
  description?: string;
  
  // Hierarchy
  /** Parent diocese ID */
  dioceseId: string;
  /** Diocese configuration (populated on fetch) */
  diocese?: DioceseConfig;
  /** Deanery name */
  deanery?: string;
  
  // Localization
  /** Primary language code (ISO 639-1) */
  language: string;
  /** Supported languages */
  supportedLanguages: string[];
  /** Timezone */
  timezone: string;
  /** Currency for donations */
  currency: 'EUR' | 'USD' | 'GBP';
  
  // Appearance
  /** Theme configuration */
  theme: ParishTheme;
  /** Logo URL */
  logoUrl?: string;
  /** Cover photo URL */
  coverPhotoUrl?: string;
  
  // Operations
  /** Contact information */
  contact: ParishContact;
  /** Regular service times */
  serviceTimes: ServiceTime[];
  /** Office hours */
  officeHours?: {
    days: string;
    hours: string;
  };
  
  // Staff (from Bitrix24)
  /** Parish priest ID */
  priestId?: string;
  /** Parish priest name */
  priestName?: string;
  /** Parish priest photo */
  priestPhoto?: string;
  /** Administrator ID */
  administratorId?: string;
  
  // Features
  /** Enabled features */
  features: {
    donations: boolean;
    eventRegistration: boolean;
    newsletter: boolean;
    liveStream: boolean;
    onlineConfession: boolean;
    prayerRequests: boolean;
  };
  
  // Metadata
  /** When the parish was established */
  establishedYear?: number;
  /** Patron saint */
  patronSaint?: string;
  /** Parish feast day */
  feastDay?: string;
  /** Last updated timestamp */
  updatedAt: string;
}

// =============================================================================
// LITURGICAL SEASON
// =============================================================================

/**
 * Liturgical season types.
 */
export type LiturgicalSeason = 
  | 'advent'
  | 'christmas'
  | 'ordinary_time'
  | 'lent'
  | 'holy_week'
  | 'easter'
  | 'pentecost';

/**
 * Get the current liturgical season based on date.
 * Approximate calculation - for production use, integrate with liturgical calendar API.
 */
export function getCurrentLiturgicalSeason(date: Date = new Date()): LiturgicalSeason {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // Calculate Easter date (approximate using Anonymous Gregorian algorithm)
  const easter = getEasterDate(year);
  
  // Advent: Starts 4 Sundays before Christmas
  const adventStart = getAdventStart(year);
  const christmas = new Date(year, 11, 25); // Dec 25
  
  // Christmas season: Dec 25 to Baptism of the Lord (Sunday after Jan 6)
  const baptismSunday = getBaptismOfLord(year);
  
  // Lent: Ash Wednesday to Holy Saturday
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  
  // Holy Week: Palm Sunday to Holy Saturday
  const palmSunday = new Date(easter);
  palmSunday.setDate(easter.getDate() - 7);
  const holySaturday = new Date(easter);
  holySaturday.setDate(easter.getDate() - 1);
  
  // Easter season: Easter to Pentecost (50 days)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Check seasons in reverse chronological order
  if (dateOnly >= adventStart && dateOnly < christmas) {
    return 'advent';
  }
  if (dateOnly >= christmas && dateOnly < baptismSunday) {
    return 'christmas';
  }
  if (dateOnly >= palmSunday && dateOnly <= holySaturday) {
    return 'holy_week';
  }
  if (dateOnly >= ashWednesday && dateOnly < palmSunday) {
    return 'lent';
  }
  if (dateOnly >= easter && dateOnly <= pentecost) {
    return 'easter';
  }
  if (dateOnly > pentecost && dateOnly < adventStart) {
    return 'ordinary_time';
  }
  
  // Default to ordinary time
  return 'ordinary_time';
}

/**
 * Calculate Easter date using Anonymous Gregorian algorithm.
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Get Advent start date (4th Sunday before Christmas).
 */
function getAdventStart(year: number): Date {
  const christmas = new Date(year, 11, 25);
  const christmasDay = christmas.getDay();
  // First Sunday of Advent is 4 Sundays before Christmas
  const daysToSubtract = christmasDay + 21; // 3 weeks + days to previous Sunday
  const adventStart = new Date(christmas);
  adventStart.setDate(christmas.getDate() - daysToSubtract);
  return adventStart;
}

/**
 * Get Baptism of the Lord date (Sunday after Jan 6).
 */
function getBaptismOfLord(year: number): Date {
  const epiphany = new Date(year, 0, 6); // Jan 6
  const epiphanyDay = epiphany.getDay();
  const daysToAdd = epiphanyDay === 0 ? 7 : 7 - epiphanyDay;
  const baptism = new Date(epiphany);
  baptism.setDate(epiphany.getDate() + daysToAdd);
  return baptism;
}

// =============================================================================
// THEME PRESETS
// =============================================================================

/**
 * Predefined theme configurations.
 */
export const THEME_PRESETS: Record<string, ParishTheme> = {
  default: {
    id: 'default',
    primaryColor: '#00843D', // Catholic green
    secondaryColor: '#1E40AF', // Church blue
    accentColor: '#D4AF37', // Gold
    headingFont: 'var(--font-merriweather)',
    bodyFont: 'var(--font-inter)',
  },
  modern: {
    id: 'modern',
    primaryColor: '#2563EB', // Modern blue
    secondaryColor: '#7C3AED', // Purple
    accentColor: '#F59E0B', // Amber
    headingFont: 'var(--font-inter)',
    bodyFont: 'var(--font-inter)',
  },
  traditional: {
    id: 'traditional',
    primaryColor: '#7C2D12', // Traditional brown
    secondaryColor: '#854D0E', // Gold-brown
    accentColor: '#B91C1C', // Cardinal red
    headingFont: 'var(--font-merriweather)',
    bodyFont: 'var(--font-merriweather)',
  },
  minimal: {
    id: 'minimal',
    primaryColor: '#18181B', // Zinc black
    secondaryColor: '#52525B', // Zinc gray
    accentColor: '#00843D', // Green accent
    headingFont: 'var(--font-inter)',
    bodyFont: 'var(--font-inter)',
  },
};

// =============================================================================
// DIOCESE DATA (MOCK)
// =============================================================================

/**
 * Mock diocese data for development.
 * TODO: Replace with API/Redis lookup in production.
 */
export const MOCK_DIOCESES: Record<string, DioceseConfig> = {
  vilnius: {
    id: 'vilnius',
    name: 'Archdiocese of Vilnius',
    shortName: 'Vilnius',
    bishopName: 'Gintaras Grušas',
    bishopTitle: 'Archbishop',
    cathedralId: '1',
    timezone: 'Europe/Vilnius',
    countryCode: 'LT',
    website: 'https://vilnius.arkivyskupija.lt',
    email: 'info@vilnius.arkivyskupija.lt',
    address: {
      street: 'Katedros a. 1',
      city: 'Vilnius',
      postalCode: 'LT-01143',
      country: 'Lithuania',
    },
  },
  kaunas: {
    id: 'kaunas',
    name: 'Archdiocese of Kaunas',
    shortName: 'Kaunas',
    bishopName: 'Kęstutis Kėvalas',
    bishopTitle: 'Archbishop',
    cathedralId: '2',
    timezone: 'Europe/Vilnius',
    countryCode: 'LT',
    website: 'https://kaunas.arkivyskupija.lt',
    email: 'info@kaunas.arkivyskupija.lt',
    address: {
      street: 'Soboro g. 1',
      city: 'Kaunas',
      postalCode: 'LT-44299',
      country: 'Lithuania',
    },
  },
  siauliai: {
    id: 'siauliai',
    name: 'Diocese of Šiauliai',
    shortName: 'Šiauliai',
    bishopName: 'Eugenijus Bartulis',
    bishopTitle: 'Bishop',
    cathedralId: '3',
    timezone: 'Europe/Vilnius',
    countryCode: 'LT',
    website: 'https://siauliai.vyskupija.lt',
    email: 'info@siauliai.vyskupija.lt',
    address: {
      street: 'Vytauto g. 83',
      city: 'Šiauliai',
      postalCode: 'LT-76334',
      country: 'Lithuania',
    },
  },
  telšiai: {
    id: 'telsiai',
    name: 'Diocese of Telšiai',
    shortName: 'Telšiai',
    bishopName: 'Algirdas Jurevičius',
    bishopTitle: 'Bishop',
    cathedralId: '4',
    timezone: 'Europe/Vilnius',
    countryCode: 'LT',
    website: 'https://telsiai.vyskupija.lt',
    email: 'info@telsiai.vyskupija.lt',
    address: {
      street: 'Katedros a. 1',
      city: 'Telšiai',
      postalCode: 'LT-87101',
      country: 'Lithuania',
    },
  },
  panevezys: {
    id: 'panevezys',
    name: 'Diocese of Panevėžys',
    shortName: 'Panevėžys',
    bishopName: 'Linas Vodopjanovas',
    bishopTitle: 'Bishop',
    cathedralId: '5',
    timezone: 'Europe/Vilnius',
    countryCode: 'LT',
    website: 'https://panevezys.vyskupija.lt',
    email: 'info@panevezys.vyskupija.lt',
    address: {
      street: 'Katedros g. 1',
      city: 'Panevėžys',
      postalCode: 'LT-35179',
      country: 'Lithuania',
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a cache key for parish configuration.
 * Used for Redis caching in production.
 */
export function getParishCacheKey(parishId: string): string {
  return `parish:${parishId}:config`;
}

/**
 * Generates a cache key for subdomain lookup.
 */
export function getSubdomainCacheKey(subdomain: string): string {
  return `subdomain:${subdomain}:parish`;
}

/**
 * Validates a subdomain format.
 * Prevents injection attacks and ensures URL-safe subdomains.
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Must be lowercase alphanumeric with hyphens
  // Between 3 and 63 characters
  // Cannot start or end with hyphen
  // Cannot have consecutive hyphens
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return (
    subdomain.length >= 3 &&
    subdomain.length <= 63 &&
    subdomainRegex.test(subdomain) &&
    !subdomain.includes('--')
  );
}

/**
 * Sanitizes a subdomain for use in headers and URLs.
 */
export function sanitizeSubdomain(subdomain: string): string {
  return subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .slice(0, 63);
}

/**
 * Generates localStorage key with parish prefix for data isolation.
 */
export function getParishStorageKey(parishId: string, key: string): string {
  return `parish:${parishId}:${key}`;
}

/**
 * Generates API cache key with parish ID for data isolation.
 */
export function getParishApiCacheKey(parishId: string, endpoint: string): string {
  return `api:${parishId}:${endpoint}`;
}
