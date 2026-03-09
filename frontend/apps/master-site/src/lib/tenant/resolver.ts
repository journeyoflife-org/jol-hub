/**
 * Parish resolver for multi-tenant subdomain routing.
 * 
 * Resolves parish configuration from subdomain with:
 * - Subdomain validation and sanitization
 * - Mock data for development (10 test parishes)
 * - TODO: Redis/API integration for production (400k+ parishes)
 * 
 * PERFORMANCE: Edge Runtime compatible (< 50ms cold start)
 */

import {
  type ParishConfig,
  type DioceseConfig,
  MOCK_DIOCESES,
  THEME_PRESETS,
  isValidSubdomain,
  sanitizeSubdomain,
  getSubdomainCacheKey,
} from './config';

// =============================================================================
// MOCK PARISH DATA (DEVELOPMENT ONLY)
// =============================================================================

/**
 * Mock parish data for development and testing.
 * TODO: Replace with Redis/API lookup in production.
 * 
 * In production, this data should be fetched from:
 * - Redis cache (primary)
 * - Bitrix24 API (fallback)
 * - Database (fallback)
 */
const MOCK_PARISHES: Record<string, ParishConfig> = {
  // Vilnius Diocese
  stmarys: {
    id: '1',
    name: "St. Mary's Parish",
    subdomain: 'stmarys',
    description: 'Historic parish in the heart of Vilnius, serving the Catholic community since 1346.',
    dioceseId: 'vilnius',
    deanery: 'Vilnius Old Town',
    language: 'lt',
    supportedLanguages: ['lt', 'en', 'pl'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.default,
    logoUrl: '/images/parishes/stmarys-logo.png',
    coverPhotoUrl: '/images/parishes/stmarys-cover.jpg',
    contact: {
      phone: '+370 5 261 1127',
      email: 'info@stmarys.vilnius.lt',
      website: 'https://stmarys.jol-hub.eu',
      address: {
        street: 'Šv. Mykolo g. 9',
        city: 'Vilnius',
        postalCode: 'LT-01124',
        country: 'Lithuania',
        coordinates: { lat: 54.6822, lng: 25.2951 },
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '08:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '10:00', type: 'mass', language: 'Polish' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '12:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '18:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 3, dayName: 'Wednesday', time: '18:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '09:00', type: 'confession', language: 'Lithuanian', notes: 'Confessions available' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '101',
    priestName: 'Fr. Jonas Kazlauskas',
    priestPhoto: '/images/priests/jonas-kazlauskas.jpg',
    administratorId: '102',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: true,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1346,
    patronSaint: 'Blessed Virgin Mary',
    feastDay: 'August 15',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  // Kaunas Diocese
  stjohn: {
    id: '2',
    name: "St. John the Baptist Parish",
    subdomain: 'stjohn',
    description: 'A vibrant parish community in Kaunas dedicated to St. John the Baptist.',
    dioceseId: 'kaunas',
    deanery: 'Kaunas City',
    language: 'lt',
    supportedLanguages: ['lt', 'en'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.modern,
    logoUrl: '/images/parishes/stjohn-logo.png',
    coverPhotoUrl: '/images/parishes/stjohn-cover.jpg',
    contact: {
      phone: '+370 37 200 200',
      email: 'info@stjohn.kaunas.lt',
      website: 'https://stjohn.jol-hub.eu',
      address: {
        street: 'Vytauto pr. 30',
        city: 'Kaunas',
        postalCode: 'LT-44328',
        country: 'Lithuania',
        coordinates: { lat: 54.8985, lng: 23.9036 },
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '09:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '11:00', type: 'mass', language: 'English' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '19:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 2, dayName: 'Tuesday', time: '18:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 5, dayName: 'Friday', time: '17:00', type: 'confession', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '08:00-16:00' },
    priestId: '201',
    priestName: 'Fr. Petras Petraitis',
    priestPhoto: '/images/priests/petras-petraitis.jpg',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: false,
      onlineConfession: true,
      prayerRequests: true,
    },
    establishedYear: 1920,
    patronSaint: 'St. John the Baptist',
    feastDay: 'June 24',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  // Šiauliai Diocese
  stjoseph: {
    id: '3',
    name: "St. Joseph's Parish",
    subdomain: 'stjoseph',
    description: 'Family-centered parish in Šiauliai.',
    dioceseId: 'siauliai',
    deanery: 'Šiauliai City',
    language: 'lt',
    supportedLanguages: ['lt'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.traditional,
    contact: {
      phone: '+370 41 500 500',
      email: 'info@stjoseph.siauliai.lt',
      address: {
        street: 'Aušros al. 10',
        city: 'Šiauliai',
        postalCode: 'LT-76298',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '10:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '301',
    priestName: 'Fr. Antanas Antanaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: false,
      liveStream: false,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1945,
    patronSaint: 'St. Joseph',
    feastDay: 'March 19',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  // Telšiai Diocese
  stpeter: {
    id: '4',
    name: "St. Peter's Parish",
    subdomain: 'stpeter',
    description: 'Historic parish in Telšiai.',
    dioceseId: 'telsiai',
    deanery: 'Telšiai City',
    language: 'lt',
    supportedLanguages: ['lt'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.default,
    contact: {
      phone: '+370 444 500 500',
      email: 'info@stpeter.telsiai.lt',
      address: {
        street: 'Katedros a. 1',
        city: 'Telšiai',
        postalCode: 'LT-87101',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '09:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '11:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '401',
    priestName: 'Fr. Kazys Kazlauskas',
    features: {
      donations: true,
      eventRegistration: false,
      newsletter: true,
      liveStream: false,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1791,
    patronSaint: 'St. Peter',
    feastDay: 'June 29',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  // Panevėžys Diocese
  stanne: {
    id: '5',
    name: "St. Anne's Parish",
    subdomain: 'stanne',
    description: 'Growing parish community in Panevėžys.',
    dioceseId: 'panevezys',
    deanery: 'Panevėžys City',
    language: 'lt',
    supportedLanguages: ['lt', 'en'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.modern,
    contact: {
      phone: '+370 45 500 500',
      email: 'info@stanne.panevezys.lt',
      address: {
        street: 'Respublikos g. 20',
        city: 'Panevėžys',
        postalCode: 'LT-35173',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '08:30', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '10:30', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '501',
    priestName: 'Fr. Vytautas Vytautaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: true,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1950,
    patronSaint: 'St. Anne',
    feastDay: 'July 26',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  // Additional parishes for testing
  'holy-cross': {
    id: '6',
    name: 'Holy Cross Parish',
    subdomain: 'holy-cross',
    description: 'Contemporary parish in Vilnius.',
    dioceseId: 'vilnius',
    deanery: 'Vilnius City',
    language: 'lt',
    supportedLanguages: ['lt', 'en', 'ru'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.minimal,
    contact: {
      phone: '+370 5 200 200',
      email: 'info@holycross.vilnius.lt',
      address: {
        street: 'Kalvarijų g. 327',
        city: 'Vilnius',
        postalCode: 'LT-09314',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '10:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '12:00', type: 'mass', language: 'English' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '601',
    priestName: 'Fr. Mindaugas Mindaugaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: true,
      onlineConfession: true,
      prayerRequests: true,
    },
    establishedYear: 2000,
    patronSaint: 'Holy Cross',
    feastDay: 'September 14',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  'st-francis': {
    id: '7',
    name: 'St. Francis of Assisi Parish',
    subdomain: 'st-francis',
    description: 'Franciscan parish in Kaunas.',
    dioceseId: 'kaunas',
    deanery: 'Kaunas City',
    language: 'lt',
    supportedLanguages: ['lt'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.traditional,
    contact: {
      phone: '+370 37 300 300',
      email: 'info@stfrancis.kaunas.lt',
      address: {
        street: 'Laisvės al. 96',
        city: 'Kaunas',
        postalCode: 'LT-44251',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '09:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '701',
    priestName: 'Fr. Pranciškus Pranciškaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: false,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1925,
    patronSaint: 'St. Francis of Assisi',
    feastDay: 'October 4',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  'st-therese': {
    id: '8',
    name: "St. Thérèse of Lisieux Parish",
    subdomain: 'st-therese',
    description: 'Carmelite spirituality parish in Vilnius.',
    dioceseId: 'vilnius',
    deanery: 'Vilnius City',
    language: 'lt',
    supportedLanguages: ['lt', 'pl'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.default,
    contact: {
      phone: '+370 5 400 400',
      email: 'info@sttherese.vilnius.lt',
      address: {
        street: 'Jasinskio g. 16',
        city: 'Vilnius',
        postalCode: 'LT-01112',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '10:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 3, dayName: 'Wednesday', time: '18:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '801',
    priestName: 'Fr. Tadas Tadaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: false,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1935,
    patronSaint: 'St. Thérèse of Lisieux',
    feastDay: 'October 1',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  'divine-mercy': {
    id: '9',
    name: 'Divine Mercy Parish',
    subdomain: 'divine-mercy',
    description: 'Parish dedicated to Divine Mercy devotion.',
    dioceseId: 'kaunas',
    deanery: 'Kaunas City',
    language: 'lt',
    supportedLanguages: ['lt', 'en'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.modern,
    contact: {
      phone: '+370 37 400 400',
      email: 'info@divinemercy.kaunas.lt',
      address: {
        street: 'Taikos pr. 50',
        city: 'Kaunas',
        postalCode: 'LT-51379',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '09:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '11:00', type: 'mass', language: 'English' },
      { dayOfWeek: 5, dayName: 'Friday', time: '15:00', type: 'mass', language: 'Lithuanian', notes: 'Divine Mercy Chaplet' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '901',
    priestName: 'Fr. Faustinas Faustaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: true,
      onlineConfession: true,
      prayerRequests: true,
    },
    establishedYear: 2005,
    patronSaint: 'Divine Mercy',
    feastDay: 'Second Sunday of Easter',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  'sacred-heart': {
    id: '10',
    name: 'Sacred Heart of Jesus Parish',
    subdomain: 'sacred-heart',
    description: 'Traditional parish with strong community focus.',
    dioceseId: 'siauliai',
    deanery: 'Šiauliai City',
    language: 'lt',
    supportedLanguages: ['lt'],
    timezone: 'Europe/Vilnius',
    currency: 'EUR',
    theme: THEME_PRESETS.traditional,
    contact: {
      phone: '+370 41 600 600',
      email: 'info@sacredheart.siauliai.lt',
      address: {
        street: 'Vilniaus g. 100',
        city: 'Šiauliai',
        postalCode: 'LT-76284',
        country: 'Lithuania',
      },
    },
    serviceTimes: [
      { dayOfWeek: 0, dayName: 'Sunday', time: '08:00', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 0, dayName: 'Sunday', time: '10:30', type: 'mass', language: 'Lithuanian' },
      { dayOfWeek: 6, dayName: 'Saturday', time: '18:00', type: 'mass', language: 'Lithuanian' },
    ],
    officeHours: { days: 'Mon-Fri', hours: '09:00-17:00' },
    priestId: '1001',
    priestName: 'Fr. Juozapas Juozapaitis',
    features: {
      donations: true,
      eventRegistration: true,
      newsletter: true,
      liveStream: false,
      onlineConfession: false,
      prayerRequests: true,
    },
    establishedYear: 1910,
    patronSaint: 'Sacred Heart of Jesus',
    feastDay: 'Friday after Second Sunday after Pentecost',
    updatedAt: '2024-01-15T10:00:00Z',
  },
};

// =============================================================================
// RESOLVER FUNCTIONS
// =============================================================================

/**
 * Resolves parish configuration from subdomain.
 * 
 * In production, this function should:
 * 1. Check Redis cache first (fastest)
 * 2. Query Bitrix24 API if not cached
 * 3. Fall back to database
 * 4. Cache result for 5 minutes
 * 
 * @param subdomain - The parish subdomain (e.g., "stmarys")
 * @returns ParishConfig if found, null otherwise
 */
export async function resolveParish(subdomain: string): Promise<ParishConfig | null> {
  // Validate subdomain format
  if (!isValidSubdomain(subdomain)) {
    console.warn(`[RESOLVER] Invalid subdomain format: ${subdomain}`);
    return null;
  }

  // Sanitize subdomain
  const sanitizedSubdomain = sanitizeSubdomain(subdomain);

  // TODO: Production implementation with Redis caching
  // const cacheKey = getSubdomainCacheKey(sanitizedSubdomain);
  // const cached = await redis.get(cacheKey);
  // if (cached) return JSON.parse(cached);

  // Mock lookup for development
  const parish = MOCK_PARISHES[sanitizedSubdomain];
  
  if (!parish) {
    console.log(`[RESOLVER] Parish not found for subdomain: ${sanitizedSubdomain}`);
    return null;
  }

  // Attach diocese information
  const diocese = MOCK_DIOCESES[parish.dioceseId];
  if (diocese) {
    parish.diocese = diocese;
  }

  // TODO: Cache result in Redis
  // await redis.setex(cacheKey, 300, JSON.stringify(parish));

  return parish;
}

/**
 * Resolves parish by ID instead of subdomain.
 * Useful for internal lookups.
 */
export async function resolveParishById(parishId: string): Promise<ParishConfig | null> {
  // TODO: Production implementation with Redis/database lookup
  const parish = Object.values(MOCK_PARISHES).find(p => p.id === parishId);
  
  if (!parish) {
    return null;
  }

  // Attach diocese information
  const diocese = MOCK_DIOCESES[parish.dioceseId];
  if (diocese) {
    parish.diocese = diocese;
  }

  return parish;
}

/**
 * Gets diocese configuration by ID.
 */
export async function resolveDiocese(dioceseId: string): Promise<DioceseConfig | null> {
  // TODO: Production implementation with Redis/database lookup
  return MOCK_DIOCESES[dioceseId] ?? null;
}

/**
 * Lists all available parishes (for directory/discovery).
 * 
 * In production, this should use pagination and search.
 */
export async function listParishes(
  options: {
    dioceseId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ParishConfig[]> {
  let parishes = Object.values(MOCK_PARISHES);

  // Filter by diocese if specified
  if (options.dioceseId) {
    parishes = parishes.filter(p => p.dioceseId === options.dioceseId);
  }

  // Apply pagination
  const offset = options.offset ?? 0;
  const limit = options.limit ?? parishes.length;
  
  return parishes.slice(offset, offset + limit);
}

/**
 * Searches parishes by name or description.
 */
export async function searchParishes(query: string): Promise<ParishConfig[]> {
  const normalizedQuery = query.toLowerCase().trim();
  
  return Object.values(MOCK_PARISHES).filter(parish =>
    parish.name.toLowerCase().includes(normalizedQuery) ||
    parish.subdomain.toLowerCase().includes(normalizedQuery) ||
    parish.description?.toLowerCase().includes(normalizedQuery) ||
    (parish.contact as any)?.city?.toLowerCase().includes(normalizedQuery)
  );
}

// =============================================================================
// PRODUCTION NOTES
// =============================================================================

/**
 * TODO: Production Redis Implementation
 * 
 * import { Redis } from '@upstash/redis';
 * 
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_REST_URL!,
 *   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 * });
 * 
 * export async function resolveParish(subdomain: string): Promise<ParishConfig | null> {
 *   // Check cache first
 *   const cacheKey = getSubdomainCacheKey(subdomain);
 *   const cached = await redis.get<string>(cacheKey);
 *   
 *   if (cached) {
 *     return JSON.parse(cached);
 *   }
 *   
 *   // Fetch from Bitrix24 API
 *   const parish = await fetchParishFromBitrix24(subdomain);
 *   
 *   if (parish) {
 *     // Cache for 5 minutes
 *     await redis.setex(cacheKey, 300, JSON.stringify(parish));
 *   }
 *   
 *   return parish;
 * }
 */

/**
 * TODO: Bitrix24 API Integration
 * 
 * async function fetchParishFromBitrix24(subdomain: string): Promise<ParishConfig | null> {
 *   // Query Bitrix24 departments where UF_SUBDOMAIN = subdomain
 *   const response = await fetch(
 *     `${process.env.BITRIX_AUTH_URL}/rest/department.get?filter[UF_SUBDOMAIN]=${subdomain}`,
 *     {
 *       headers: {
 *         'Authorization': `Bearer ${accessToken}`,
 *       },
 *     }
 *   );
 *   
 *   const data = await response.json();
 *   
 *   if (!data.result || data.result.length === 0) {
 *     return null;
 *   }
 *   
 *   return transformBitrixDepartmentToParish(data.result[0]);
 * }
 */
