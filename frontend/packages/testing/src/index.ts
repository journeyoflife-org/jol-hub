/**
 * @jol-hub/testing — shared test harness (STEP 15).
 *
 *   setup       vitest setupFiles entry (cleanup, jsdom shims, determinism)
 *   render      renderWithProviders (theme + i18n + app wrapper)
 *   mocks       tenant/auth fixtures + MSW handlers for the hub backend
 *   fixtures    canonical block drafts + the XSS payload battery
 *
 * Contract: deterministic (no random/time dependence), isolated (no shared
 * state), offline (no real network — MSW or injected fetch only).
 */
export { renderWithProviders, type RenderWithProvidersOptions } from './render';
export {
  mockTenant,
  mockCheapTenant,
  mockFuneralTenant,
} from './mocks/tenant';
export {
  mockSession,
  mockAdminSession,
  mockSuperAdminSession,
  mockViewerSession,
  type MockAuthSession,
} from './mocks/auth';
export {
  backendHandlers,
  MOCK_BACKEND_URL,
  MOCK_DRAFT,
  MOCK_MEDIA_LIBRARY,
  MOCK_MODERATION_QUEUE,
} from './mocks/api';
export {
  validBlocks,
  hostileBlocks,
  XSS_PAYLOADS,
  CONTACT_XSS_PAYLOADS,
  type FixtureBlock,
} from './fixtures/blocks';
