/**
 * Dynamic collections — STEP 6 (News, Events, Services).
 *
 * Collection items are Zod-validated domain objects. Source is the backend
 * content service (RLS-scoped via content-api). In the pilot the backend is
 * not configured, so collections resolve to EMPTY — pages render accessible
 * empty states. Content is never fabricated for real tenants; it flows from
 * the backend when that service ships.
 *
 * SECURITY: item payloads come from the backend for THIS tenant only (RLS);
 * unknown slugs resolve to `null` → route layer renders a bare 404.
 */
import { z } from 'zod';
import type { Tenant } from '@jol-hub/tenant-resolver';
import {
  ContentApiError,
  fetchTenantCollection,
  fetchTenantCollectionItem,
  type CollectionKind,
} from './content-api';

/* ------------------------------------------------------------------ */
/* Item schemas                                                        */
/* ------------------------------------------------------------------ */

export const NewsItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().default(''),
  /** ISO 8601 publication timestamp. */
  publishedAt: z.string().min(1),
  updatedAt: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  readTime: z.string().optional(),
  /** Full body for the detail view (Markdown-lite / plain text). */
  body: z.string().optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const EventItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  /** ISO 8601 start date-time. */
  startDateTime: z.string().min(1),
  endDateTime: z.string().optional(),
  location: z.string().optional(),
  recurring: z.boolean().optional(),
  category: z.string().optional(),
  /** Registration/booking target (NORMAL/VIP entitlement). */
  registrationUrl: z.string().optional(),
});
export type EventItem = z.infer<typeof EventItemSchema>;

export const ServiceItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  /** Price in EUR — present only for commercial verticals. */
  price: z.number().nonnegative().optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
  /** Booking entitlement gate (CHEAP hides booking). */
  bookable: z.boolean().optional(),
});
export type ServiceItem = z.infer<typeof ServiceItemSchema>;

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

function parseMany<T>(schema: z.ZodType<T, z.ZodTypeDef, any>, raw: unknown[] | null): T[] {
  if (!raw) return [];
  const items: T[] = [];
  for (const entry of raw) {
    const parsed = schema.safeParse(entry);
    if (parsed.success) {
      items.push(parsed.data);
    } else {
      // Drop malformed entries rather than render garbage; log sanitized.
      console.error(`[collections] dropped invalid item (${parsed.error.issues.length} issue(s))`);
    }
  }
  return items;
}

function parseOne<T>(schema: z.ZodType<T, z.ZodTypeDef, any>, raw: unknown | null): T | null {
  if (raw === null || raw === undefined) return null;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

/* ------------------------------------------------------------------ */
/* Public accessors                                                    */
/* ------------------------------------------------------------------ */

export interface CollectionQuery {
  category?: string;
  /** Pagination (1-based). */
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Fetch + validate a full collection (empty in pilot). */
export async function getCollection<T>(
  tenant: Tenant,
  kind: CollectionKind,
  // `any` input: collection schemas use `.default()`, so input ≠ output and a
  // strict `ZodType<T>` would widen T. T is the OUTPUT (parsed) type.
  schema: z.ZodType<T, z.ZodTypeDef, any>,
): Promise<T[]> {
  try {
    const raw = await fetchTenantCollection(tenant, kind);
    return parseMany(schema, raw);
  } catch (error) {
    if (error instanceof ContentApiError && error.kind === 'not-found') return [];
    throw error;
  }
}

export const getNews = (tenant: Tenant) => getCollection(tenant, 'news', NewsItemSchema);
export const getEvents = (tenant: Tenant) => getCollection(tenant, 'events', EventItemSchema);
export const getServices = (tenant: Tenant) => getCollection(tenant, 'services', ServiceItemSchema);

/** Fetch + validate a single collection item (null → 404 upstream). */
export async function getCollectionItem<T>(
  tenant: Tenant,
  kind: CollectionKind,
  schema: z.ZodType<T, z.ZodTypeDef, any>,
  slug: string,
): Promise<T | null> {
  try {
    const raw = await fetchTenantCollectionItem(tenant, kind, slug);
    return parseOne(schema, raw);
  } catch (error) {
    if (error instanceof ContentApiError && error.kind === 'not-found') return null;
    throw error;
  }
}

export const getNewsItem = (tenant: Tenant, slug: string) =>
  getCollectionItem(tenant, 'news', NewsItemSchema, slug);
export const getEventItem = (tenant: Tenant, slug: string) =>
  getCollectionItem(tenant, 'events', EventItemSchema, slug);
export const getServiceItem = (tenant: Tenant, slug: string) =>
  getCollectionItem(tenant, 'services', ServiceItemSchema, slug);

/* ------------------------------------------------------------------ */
/* Pure helpers (testable, date-safe)                                  */
/* ------------------------------------------------------------------ */

/** Paginate an array (1-based). Deterministic and total-preserving. */
export function paginate<T>(items: T[], page: number, pageSize: number): PagedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = (clamped - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: clamped,
    pageSize,
    totalPages,
  };
}

/** Filter events into upcoming vs past relative to `now`. */
export function splitEventsByTime(
  events: EventItem[],
  now: Date,
): { upcoming: EventItem[]; past: EventItem[] } {
  const nowMs = now.getTime();
  const upcoming: EventItem[] = [];
  const past: EventItem[] = [];
  for (const event of events) {
    const start = Date.parse(event.startDateTime);
    if (Number.isNaN(start) || start >= nowMs) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }
  upcoming.sort((a, b) => Date.parse(a.startDateTime) - Date.parse(b.startDateTime));
  past.sort((a, b) => Date.parse(b.startDateTime) - Date.parse(a.startDateTime));
  return { upcoming, past };
}

/** A single cell in a month grid. */
export interface CalendarCell {
  /** ISO date (yyyy-mm-dd) or null for leading/trailing blanks. */
  date: string | null;
  dayOfMonth: number | null;
  inMonth: boolean;
}

/**
 * Build a Monday-first month grid for the given year/month (0-based month).
 * Deterministic; no timezone assumptions (pure calendar arithmetic).
 */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // getUTCDay: 0=Sun..6=Sat → convert to Monday-first index (Mon=0..Sun=6).
  const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ date: null, dayOfMonth: null, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ date: iso, dayOfMonth: day, inMonth: true });
  }
  // Pad to a whole number of weeks so the grid is rectangular.
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayOfMonth: null, inMonth: false });
  }
  return cells;
}

/** Group events by ISO date (yyyy-mm-dd) for calendar indicators. */
export function eventsByDate(events: EventItem[]): Map<string, EventItem[]> {
  const map = new Map<string, EventItem[]>();
  for (const event of events) {
    const start = Date.parse(event.startDateTime);
    if (Number.isNaN(start)) continue;
    const d = new Date(start);
    const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`;
    const bucket = map.get(iso);
    if (bucket) {
      bucket.push(event);
    } else {
      map.set(iso, [event]);
    }
  }
  return map;
}
