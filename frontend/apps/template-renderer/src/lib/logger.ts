/**
 * Server logger binding — STEP 16.
 *
 * One structured JSON-lines logger for the renderer's Node surfaces
 * (API routes, server components, scripts). Edge middleware uses the
 * package factory directly (this module's bindings are server-shaped).
 *
 * RULES honored: level resolved via `levelFromEnv` (never debug in
 * production); every emitted record is deep-redacted by the core.
 */
import { createLogger, levelFromEnv } from '@jol-hub/observability';

export const logger = createLogger({
  service: 'template-renderer',
  minLevel: levelFromEnv(process.env),
  bindings: {
    env: process.env.NODE_ENV ?? 'development',
  },
});
