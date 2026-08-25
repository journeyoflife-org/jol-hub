/**
 * Page configuration schema — STEP 6.
 *
 * A page is an ordered list of modules. JOL controls the composition
 * (module order/types/layout — the 90%); tenants may only toggle module
 * `visible` flags (the constrained 10%). Configs arrive from the content
 * API and are ALWAYS Zod-validated before rendering — an invalid config
 * fails gracefully to the fallback layout rather than rendering garbage.
 */
import { z } from 'zod';

/** Module vocabulary. Extending = add a union member + a registry entry. */
export const ModuleTypeSchema = z.enum([
  'hero',
  'content',
  'feature-grid',
  'news-list',
  'event-list',
  'service-list',
  'gallery',
  'testimonial',
  'contact-form',
  'map',
  'donation-cta',
  'subscription-cta',
]);
export type ModuleType = z.infer<typeof ModuleTypeSchema>;

/** Layout containers a module may be wrapped in. */
export const ModuleLayoutSchema = z.enum([
  'full-width',
  'contained',
  'two-column-60-40',
  'two-column-50-50',
  'three-column',
]);
export type ModuleLayout = z.infer<typeof ModuleLayoutSchema>;

/**
 * A single module instance. `props`/`settings` are validated loosely here
 * (shape varies per type); each module component enforces its own strict
 * prop contract before rendering.
 */
export const ModuleSchema = z.object({
  /** Stable id — used as the React key and for tenant visibility toggles. */
  id: z.string().min(1),
  type: ModuleTypeSchema,
  /** Module-specific content/props. */
  props: z.record(z.unknown()).optional().default({}),
  /** Layout container. Defaults to `contained`. */
  layout: ModuleLayoutSchema.optional().default('contained'),
  /** Non-content behavior settings (spacing, alignment, …). */
  settings: z.record(z.unknown()).optional().default({}),
  /** Tenant-controlled visibility toggle (the 10%). Defaults to true. */
  visible: z.boolean().optional().default(true),
});
export type Module = z.infer<typeof ModuleSchema>;

/** A full page configuration. */
export const PageConfigSchema = z.object({
  /** Tenant-relative route this config renders, e.g. `/` or `/about`. */
  route: z.string().regex(/^\/[a-z0-9-]*(\/[a-z0-9-]+)*$/),
  /** Optional page title override (localized by the caller). */
  title: z.string().optional(),
  /** Ordered modules — order is JOL-controlled. */
  modules: z.array(ModuleSchema).default([]),
});
export type PageConfig = z.infer<typeof PageConfigSchema>;

export interface ParseResult {
  ok: boolean;
  config: PageConfig | null;
  /** Human-readable reason when `ok` is false (logged server-side only). */
  error?: string;
}

/**
 * Validate a raw page config. On failure, logs a sanitized error (never the
 * raw payload — it may contain tenant content) and returns `ok: false` so
 * the caller renders the fallback layout.
 */
export function parsePageConfig(raw: unknown, route: string): ParseResult {
  const result = PageConfigSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, config: result.data };
  }
  // Sanitized: report issue count + first path, not the payload itself.
  const first = result.error.issues[0];
  const where = first ? first.path.join('.') : '(root)';
  console.error(
    `[page-config] invalid config for ${route}: ${result.error.issues.length} issue(s), first at '${where}'`,
  );
  return { ok: false, config: null, error: where };
}

/**
 * Minimal valid config used when a fetched config is missing/invalid:
 * a Hero + a content module. The actual copy is translated at render time
 * (i18n) — this carries no user-visible literals.
 */
export function buildFallbackConfig(route: string): PageConfig {
  return {
    route,
    modules: [
      {
        id: 'fallback-hero',
        type: 'hero',
        props: { kind: 'fallback' },
        layout: 'full-width',
        settings: {},
        visible: true,
      },
      {
        id: 'fallback-content',
        type: 'content',
        props: { kind: 'config-error' },
        layout: 'contained',
        settings: {},
        visible: true,
      },
    ],
  };
}
