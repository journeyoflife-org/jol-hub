/**
 * useTranslation — Public API barrel (LEGACY i18next surface).
 *
 * Exports:
 *   - useTranslation          (react-i18next, primary hook)
 *   - useTranslationWithDeepL (enhanced hook with DeepL fallback)
 *   - translateUserContent    (standalone async utility)
 *   - Liturgical guard + terms (pure; defined in ../lib/liturgical.ts)
 *
 * STEP 4: the pure liturgical helpers moved to ../lib/liturgical.ts so the
 * main package barrel can export them WITHOUT evaluating react-i18next in
 * server bundles. This file stays for back-compat of existing import paths.
 *
 * NOTE: DeepL translation functions (translateWithDeepL, translateBatchWithDeepL)
 * are server-side only. Import them from '@jol-hub/i18n/server' when needed
 * in Server Actions or API routes.
 */

export { useTranslation } from 'react-i18next';

export {
  useTranslationWithDeepL,
  translateUserContent,
} from './use-translation-with-deepl';

export type {
  UseTranslationWithDeepLReturn,
  TranslationCacheEntry,
  DeepLTranslationResponse,
} from './use-translation-with-deepl';

// Pure liturgical helpers (no react-i18next in their module graph).
export {
  containsLiturgicalContent,
  LITURGICAL_TERMS,
  getLiturgicalTerm,
  isLiturgicalTerm,
} from '../lib/liturgical';

export type { DeepLTranslationResult, TranslateOptions } from '../lib/liturgical';
