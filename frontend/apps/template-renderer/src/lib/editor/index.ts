/**
 * @/lib/editor barrel — STEP 14 (constrained block editor core).
 *
 * Pure, unit-tested primitives (blocks/sanitize/diff/moderation/validation)
 * + the backend client. React components live in `@/components/editor`.
 *
 * SECURITY: no raw HTML anywhere — rich text is structured (text + marks),
 * rendering is escape-first, URLs are allowlisted, and DOMPurify is the
 * final client-side layer.
 */
export * from './blocks';
export * from './sanitize';
export * from './diff';
export * from './moderation';
export * from './validation';
export {
  EditorApiClient,
  type DraftResponse,
  type EditorApiError,
  type EditorClientOptions,
  type EditorResult,
  type EditorRevision,
} from './editor-api';
