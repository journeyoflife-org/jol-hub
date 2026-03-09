/**
 * Parish configuration types and utilities for multi-tenant setup.
 */

export interface ParishConfig {
  id: string;
  subdomain: string;
  name: string;
  nameLt: string;
  nameRu?: string;
  nameEn?: string;
  address: string;
  city: string;
  diocese: string;
  deanery: string;
  phone?: string;
  email?: string;
  website?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  massSchedule: MassSchedule;
  confessionSchedule?: ConfessionSchedule[];
  feastDays?: FeastDay[];
  socialLinks?: SocialLinks;
  branding?: ParishBranding;
}

export interface MassSchedule {
  weekdays: MassTime[];
  saturdays: MassTime[];
  sundays: MassTime[];
  holyDays?: MassTime[];
}

export interface MassTime {
  time: string;
  language?: 'lt' | 'ru' | 'en' | 'pl';
  type?: 'regular' | 'youth' | 'family' | 'latin';
}

export interface ConfessionSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface FeastDay {
  date: string;
  nameLt: string;
  nameEn?: string;
  massSchedule?: MassTime[];
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface ParishBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  heroImage?: string;
}

/**
 * Fetches parish configuration by subdomain.
 * In production, this would fetch from a cache or database.
 */
export async function getParishConfig(subdomain: string): Promise<ParishConfig | null> {
  // Placeholder - implement actual data fetching
  console.log(`Fetching config for subdomain: ${subdomain}`);
  return null;
}

/**
 * Fetches parish configuration by ID.
 */
export async function getParishConfigById(id: string): Promise<ParishConfig | null> {
  // Placeholder - implement actual data fetching
  console.log(`Fetching config for parish ID: ${id}`);
  return null;
}
