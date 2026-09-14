/**
 * @jol-hub/seo — SEO architecture core (STEP 11).
 *
 * Pure, framework-agnostic, unit-tested SEO primitives: canonicals, hreflang
 * (reciprocal by construction), metadata/robots policy, JSON-LD generators,
 * sitemap sharding, OG + IndexNow integration contracts. The renderer composes
 * these into Next.js Metadata/JSON-LD (see `apps/template-renderer/lib/seo.tsx`).
 */
export * from './types';
export * from './canonical';
export * from './hreflang';
export * from './metadata';
export * from './structured-data';
export * from './sitemap';
export * from './robots';
export * from './open-graph';
export * from './indexing';
