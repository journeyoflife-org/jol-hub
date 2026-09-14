/**
 * DeepL Server-Side Module
 * 
 * This module is ONLY for server-side usage (Server Actions, Route Handlers, API routes).
 * It imports the deepl-node SDK which requires Node.js built-in modules (fs, path, etc.)
 * that are not available in the browser.
 * 
 * DO NOT import this in client components or hooks.
 */

import * as deepl from 'deepl-node';
import type { SupportedLocale } from '../types';

// Map JOL-HUB locale codes → deepl-node TargetLanguageCode
const DEEPL_LANG_MAP: Record<SupportedLocale, deepl.TargetLanguageCode> = {
  lt: 'lt',
  ru: 'ru',
  en: 'en-US',
};

let _translator: deepl.Translator | null = null;

/**
 * Returns the lazily-initialised DeepL Translator singleton.
 */
export function getDeepLTranslator(): deepl.Translator {
  if (_translator) return _translator;

  const apiKey =
    process.env.DEEPL_API_KEY ?? process.env.NEXT_PUBLIC_DEEPL_API_KEY;

  if (!apiKey) {
    throw new Error(
      '[JOL-HUB/i18n] DeepL API key not configured. ' +
        'Set DEEPL_API_KEY (server) or NEXT_PUBLIC_DEEPL_API_KEY (client).'
    );
  }

  _translator = new deepl.Translator(apiKey);
  return _translator;
}

export interface TranslateOptions {
  sourceLang?: deepl.SourceLanguageCode | null;
  formality?: deepl.Formality;
  splitSentences?: deepl.SentenceSplittingMode;
  context?: string;
  tagHandling?: deepl.TagHandlingMode;
}

export interface DeepLTranslationResult {
  translations: Array<{
    detected_source_language?: string;
    text: string;
  }>;
}

/**
 * Translate a single string using the official `deepl-node` SDK.
 * SERVER-SIDE ONLY.
 */
export async function translateWithDeepL(
  text: string,
  targetLang: SupportedLocale,
  options: TranslateOptions = {}
): Promise<DeepLTranslationResult> {
  const {
    sourceLang = null,
    formality = 'default',
    splitSentences = 'on',
    context,
    tagHandling = 'html',
  } = options;

  const translator = getDeepLTranslator();
  const targetCode = DEEPL_LANG_MAP[targetLang];

  const sdkOptions: deepl.TranslateTextOptions = {
    formality,
    splitSentences,
    tagHandling,
    ...(context !== undefined ? { context } : {}),
  };

  const result = await translator.translateText(
    text,
    sourceLang,
    targetCode,
    sdkOptions
  );

  const items: deepl.TextResult[] = Array.isArray(result) ? result : [result];

  return {
    translations: items.map((r) => ({
      detected_source_language: r.detectedSourceLang,
      text: r.text,
    })),
  };
}

/**
 * Translate multiple strings in a single DeepL API call.
 * SERVER-SIDE ONLY.
 */
export async function translateBatchWithDeepL(
  texts: string[],
  targetLang: SupportedLocale,
  options: TranslateOptions = {}
): Promise<DeepLTranslationResult> {
  if (texts.length === 0) {
    return { translations: [] };
  }

  const {
    sourceLang = null,
    formality = 'default',
    splitSentences = 'on',
    context,
    tagHandling = 'html',
  } = options;

  const translator = getDeepLTranslator();
  const targetCode = DEEPL_LANG_MAP[targetLang];

  const sdkOptions: deepl.TranslateTextOptions = {
    formality,
    splitSentences,
    tagHandling,
    ...(context !== undefined ? { context } : {}),
  };

  const result = await translator.translateText(
    texts,
    sourceLang,
    targetCode,
    sdkOptions
  );

  const items: deepl.TextResult[] = Array.isArray(result) ? result : [result];

  return {
    translations: items.map((r) => ({
      detected_source_language: r.detectedSourceLang,
      text: r.text,
    })),
  };
}
