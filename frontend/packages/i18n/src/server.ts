/**
 * Server-only exports for @jol-hub/i18n
 * 
 * These exports use the deepl-node SDK which requires Node.js built-in modules.
 * They can ONLY be used in:
 * - Server Actions
 * - Route Handlers (API routes)
 * - Server Components (async functions)
 * 
 * DO NOT import these in client components or regular hooks.
 * Use '@jol-hub/i18n' for client-safe imports.
 */

export {
  translateWithDeepL,
  translateBatchWithDeepL,
  getDeepLTranslator,
  type TranslateOptions,
  type DeepLTranslationResult,
} from './lib/deepl-server';
