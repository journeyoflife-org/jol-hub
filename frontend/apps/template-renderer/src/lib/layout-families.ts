/**
 * Layout families — resolution DATA (ADR-001 chain: tenant vertical → layout).
 *
 * Lives in `lib/` (data/resolution layer), not `components/`: DS-THEME-01
 * forbids denomination literals in COMPONENT code (branching logic); the
 * exhaustive `Record<Vertical, …>` keys below are references to the
 * tenant-data controlled vocabulary (@jol-hub/seed-data `Vertical`), the same
 * layer as template-registry.ts. Family names themselves must stay
 * STRUCTURAL — the eastern-liturgical family is named 'eastern' (covers the
 * orthodox-church + greek-catholic verticals), never after a denomination
 * (O-022 remediation).
 */
import type { Vertical } from '@jol-hub/seed-data';

/** Layout families grouped by vertical — structural names only. */
export type LayoutFamily = 'sacred' | 'eastern' | 'administrative' | 'memorial' | 'congregation';

export const VERTICAL_FAMILY: Record<Vertical, LayoutFamily> = {
  parish: 'sacred',
  basilica: 'sacred',
  cathedral: 'sacred',
  chapel: 'sacred',
  monastery: 'sacred',
  'orthodox-church': 'eastern',
  'greek-catholic': 'eastern',
  diocese: 'administrative',
  deanery: 'administrative',
  cemetery: 'memorial',
  'funeral-home': 'memorial',
  'protestant-church': 'congregation',
};

export const FAMILY_ACCENT: Record<LayoutFamily, string> = {
  sacred: 'border-liturgical-gold',
  eastern: 'border-liturgical-purple',
  administrative: 'border-primary',
  memorial: 'border-gray-400',
  congregation: 'border-liturgical-green',
};

/**
 * STEP 17 polish: cemetery care is a commercial, trust-driven vertical —
 * it gets the fresh green accent while funeral homes keep the restrained
 * memorial grey (same family, different brand voice).
 */
export const VERTICAL_ACCENT_OVERRIDE: Partial<Record<Vertical, string>> = {
  cemetery: 'border-liturgical-green',
};
