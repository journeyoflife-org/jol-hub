/**
 * Zod schemas for tenant seed fixtures.
 *
 * Every JSON file in `fixtures/tenants/` MUST validate against
 * `TenantFixtureSchema`. Fixtures carry ONLY differentiating content
 * (what makes a tenant unique); shared UI (consent, cookies, privacy,
 * DSR pages) is rendered by the template-renderer app itself.
 *
 * ROLLBACK NOTE (STEP 1): the fixtures in this package are the canonical
 * extraction of the deleted `frontend/apps/lt-*` demo apps. To restore a
 * legacy app, recreate it under `frontend/apps/` from the git history of
 * branch `feat/template-renderer-step1` (fixtures remain valid seed data).
 */
import { z } from 'zod';
import { GovernanceSchema, isValidRRule } from './governance';
export { GovernanceSchema, type Governance, type ApprovalStatus } from './governance';

/** BCP-47-style short locale tag; fixtures are Lithuanian-first. */
export const LocaleSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/);

/** Localized text: `lt` is mandatory, `en` and `ru` optional (3-locale parity). */
export const LocalizedTextSchema = z.object({
  lt: z.string().min(1),
  en: z.string().optional(),
  ru: z.string().optional(),
  pl: z.string().optional(), // Wave 0 — groundwork per D13
});
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

/** Tenant vertical — drives layout selection in TemplateRenderer. */
export const VerticalSchema = z.enum([
  'parish',
  'basilica',
  'cathedral',
  'chapel',
  'monastery',
  'diocese',
  'deanery',
  'cemetery',
  'funeral-home',
  'orthodox-church',
  'greek-catholic',
  'protestant-church',
]);
export type Vertical = z.infer<typeof VerticalSchema>;

/* ------------------------------------------------------------------ */
/* Content blocks                                                      */
/* ------------------------------------------------------------------ */

const HeroBlockSchema = z.object({
  type: z.literal('hero'),
  heading: LocalizedTextSchema,
  subheading: LocalizedTextSchema.optional(),
  body: LocalizedTextSchema.optional(),
  /**
   * Optional hero photograph (STEP 17 polish). Explicit width/height are
   * REQUIRED (CLS prevention, STEP 3 rule); alt is required for WCAG 1.1.1.
   */
  image: z
    .object({
      src: z.string().min(1),
      alt: LocalizedTextSchema,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
});

const TextBlockSchema = z.object({
  type: z.literal('text'),
  heading: LocalizedTextSchema.optional(),
  body: LocalizedTextSchema,
});

const KeyValueBlockSchema = z.object({
  type: z.literal('keyValue'),
  heading: LocalizedTextSchema.optional(),
  items: z
    .array(
      z.object({
        label: LocalizedTextSchema,
        value: z.string(),
      })
    )
    .min(1),
});

export const ScheduleBlockSchema = z.object({
  type: z.literal('schedule'),
  heading: LocalizedTextSchema.optional(),
  entries: z
    .array(
      z.object({
        day: LocalizedTextSchema, // Changed from string — D12
        dayEn: z.string().optional(),
        times: z.array(z.string()).min(1),
        /** iCalendar RRULE for recurrence (D12). */
        rrule: z
          .string()
          .refine(isValidRRule, { message: 'Invalid iCalendar RRULE format' })
          .optional(),
        /** ISO 8601 date from which this rule is effective. */
        validFrom: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        /** ISO 8601 date until which this rule is effective. */
        validTo: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        notes: z.string().optional(),
      })
    )
    .min(1),
});

const ListBlockSchema = z.object({
  type: z.literal('list'),
  heading: LocalizedTextSchema.optional(),
  items: z
    .array(
      z.object({
        title: LocalizedTextSchema,
        subtitle: LocalizedTextSchema.optional(),
        description: LocalizedTextSchema.optional(),
        price: z.number().nonnegative().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .min(1),
});

const StatsBlockSchema = z.object({
  type: z.literal('stats'),
  heading: LocalizedTextSchema.optional(),
  items: z
    .array(
      z.object({
        label: LocalizedTextSchema,
        value: z.union([z.string(), z.number()]),
      })
    )
    .min(1),
});

const CtaBlockSchema = z.object({
  type: z.literal('cta'),
  heading: LocalizedTextSchema.optional(),
  links: z
    .array(
      z.object({
        label: LocalizedTextSchema,
        href: z.string().min(1),
      })
    )
    .min(1),
});

/**
 * Mass schedule block — emits Event JSON-LD with startDate.
 * NOT openingHoursSpecification (that models visitor opening hours).
 */
export const MassScheduleBlockSchema = z.object({
  type: z.literal('massSchedule'),
  heading: LocalizedTextSchema.optional(),
  masses: z
    .array(
      z.object({
        day: LocalizedTextSchema, // Changed from string — D12
        dayEn: z.string().optional(),
        time: z.string().min(1),
        /** iCalendar RRULE for recurrence (D12). */
        rrule: z.string().refine(isValidRRule, {
          message: 'Invalid iCalendar RRULE format (FREQ= required)',
        }),
        /** ISO 8601 date from which this rule is effective. */
        validFrom: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        /** ISO 8601 date until which this rule is effective. */
        validTo: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        language: z.string().optional(),
        notes: LocalizedTextSchema.optional(),
      })
    )
    .min(1),
});

/** Image gallery block — WCAG 1.1.1 requires alt text for every image. */
const GalleryBlockSchema = z.object({
  type: z.literal('gallery'),
  heading: LocalizedTextSchema.optional(),
  images: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: LocalizedTextSchema,
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        caption: LocalizedTextSchema.optional(),
      })
    )
    .min(1),
});

/** FAQ block — emits FAQPage JSON-LD. */
const FaqBlockSchema = z.object({
  type: z.literal('faq'),
  heading: LocalizedTextSchema.optional(),
  questions: z
    .array(
      z.object({
        question: LocalizedTextSchema,
        answer: LocalizedTextSchema,
      })
    )
    .min(1),
});

/**
 * Sacrament list block — emits Service JSON-LD.
 * Sacraments are liturgical services offered by the tenant.
 */
const SacramentListBlockSchema = z.object({
  type: z.literal('sacramentList'),
  heading: LocalizedTextSchema.optional(),
  sacraments: z
    .array(
      z.object({
        name: LocalizedTextSchema,
        description: LocalizedTextSchema.optional(),
        /** ISO 8601 duration or schedule description. */
        schedule: LocalizedTextSchema.optional(),
        requirements: LocalizedTextSchema.optional(),
      })
    )
    .min(1),
});

/**
 * Clergy role list block — ROLES ONLY, never names.
 * Clergy names are Art. 9 personal data and must come from the
 * RLS-scoped content API, never from a committed fixture.
 */
const ClergyRoleListBlockSchema = z.object({
  type: z.literal('clergyRoleList'),
  heading: LocalizedTextSchema.optional(),
  roles: z
    .array(
      z.object({
        role: LocalizedTextSchema,
        description: LocalizedTextSchema.optional(),
        contact: z.string().email().optional(),
      })
    )
    .min(1),
});

/** Visiting info block — visitor opening hours (not mass times). */
const VisitingInfoBlockSchema = z.object({
  type: z.literal('visitingInfo'),
  heading: LocalizedTextSchema.optional(),
  hours: z
    .array(
      z.object({
        day: z.string().min(1),
        dayEn: z.string().optional(),
        open: z.string().min(1),
        close: z.string().min(1),
        notes: LocalizedTextSchema.optional(),
      })
    )
    .min(1),
  admission: LocalizedTextSchema.optional(),
});

/** Map location block — self-hosted tiles or static image. */
const MapLocationBlockSchema = z.object({
  type: z.literal('mapLocation'),
  heading: LocalizedTextSchema.optional(),
  /** Latitude in decimal degrees (WGS 84). */
  lat: z.number().min(-90).max(90),
  /** Longitude in decimal degrees (WGS 84). */
  lng: z.number().min(-180).max(180),
  /** Optional static map image (fallback for JS-disabled browsers). */
  staticMap: z
    .object({
      src: z.string().min(1),
      alt: LocalizedTextSchema,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  /** Optional directions link (e.g. Google Maps). */
  directionsUrl: z.string().url().optional(),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  TextBlockSchema,
  KeyValueBlockSchema,
  ScheduleBlockSchema,
  ListBlockSchema,
  StatsBlockSchema,
  CtaBlockSchema,
  MassScheduleBlockSchema,
  GalleryBlockSchema,
  FaqBlockSchema,
  SacramentListBlockSchema,
  ClergyRoleListBlockSchema,
  VisitingInfoBlockSchema,
  MapLocationBlockSchema,
]);
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

/* ------------------------------------------------------------------ */
/* Pages and fixtures                                                  */
/* ------------------------------------------------------------------ */

export const TenantPageSchema = z.object({
  /** Route relative to the tenant root, e.g. `/` or `/sacraments`. */
  route: z.string().regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/),
  title: LocalizedTextSchema,
  contentBlocks: z.array(ContentBlockSchema),
  /** Free-form SEO/meta pairs rendered into the page <head>. */
  meta: z.record(z.string()).optional(),
});
export type TenantPage = z.infer<typeof TenantPageSchema>;

/**
 * Optional tenant identity block (canonical registry data). Kept separate
 * from page content so the resolver and admin tooling can address tenants
 * without walking content blocks.
 */
export const TenantIdentitySchema = z.object({
  entityId: z.string().min(1),
  jurisdiction: z.string().optional(),
  established: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  domain: z.string().optional(),
  theme: z.string().optional(),
});
export type TenantIdentity = z.infer<typeof TenantIdentitySchema>;

export const TenantFixtureSchema = z.object({
  /** URL-safe tenant slug; also the subdomain label and X-Tenant value. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(64),
  vertical: VerticalSchema,
  locale: LocaleSchema,
  name: LocalizedTextSchema,
  tagline: LocalizedTextSchema,
  identity: TenantIdentitySchema.optional(),
  /** Governance metadata — required in v2 (source verification + approval). */
  governance: GovernanceSchema,
  pages: z.array(TenantPageSchema).min(1),
});
export type TenantFixture = z.infer<typeof TenantFixtureSchema>;

/** Fixture payload schema version reported by the tenant resolver. */
export const TENANT_FIXTURE_SCHEMA = 'tenant-fixture/v2' as const;
export type TenantFixtureSchemaVersion = typeof TENANT_FIXTURE_SCHEMA;
