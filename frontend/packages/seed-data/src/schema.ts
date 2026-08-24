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

/** BCP-47-style short locale tag; fixtures are Lithuanian-first. */
export const LocaleSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/);

/** Localized text: `lt` is mandatory, `en` optional. */
export const LocalizedTextSchema = z.object({
  lt: z.string().min(1),
  en: z.string().optional(),
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
      }),
    )
    .min(1),
});

const ScheduleBlockSchema = z.object({
  type: z.literal('schedule'),
  heading: LocalizedTextSchema.optional(),
  entries: z
    .array(
      z.object({
        day: z.string().min(1),
        dayEn: z.string().optional(),
        times: z.array(z.string()).min(1),
        notes: z.string().optional(),
      }),
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
      }),
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
      }),
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
      }),
    )
    .min(1),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  TextBlockSchema,
  KeyValueBlockSchema,
  ScheduleBlockSchema,
  ListBlockSchema,
  StatsBlockSchema,
  CtaBlockSchema,
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
  pages: z.array(TenantPageSchema).min(1),
});
export type TenantFixture = z.infer<typeof TenantFixtureSchema>;

/** Fixture payload schema version reported by the tenant resolver. */
export const TENANT_FIXTURE_SCHEMA = 'tenant-fixture/v1' as const;
export type TenantFixtureSchemaVersion = typeof TENANT_FIXTURE_SCHEMA;
