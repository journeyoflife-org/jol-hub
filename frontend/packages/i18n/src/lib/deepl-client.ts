/**
 * DeepL Client-Side Module
 *
 * This module provides client-safe DeepL translation by calling an API route.
 * DO NOT import deepl-node SDK here - it requires Node.js built-ins.
 */

import type { SupportedLocale } from '../types';
import type { DeepLTranslationResult, TranslateOptions } from './deepl-server';

/**
 * Translate a single string via the DeepL API route.
 * CLIENT-SAFE - can be used in React components and hooks.
 */
export async function translateWithDeepL(
  text: string,
  targetLang: SupportedLocale,
  options: TranslateOptions = {}
): Promise<DeepLTranslationResult> {
  const response = await fetch('/api/i18n/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      targetLang,
      options,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepL translation failed: ${error}`);
  }

  return response.json();
}

/**
 * Translate multiple strings via the DeepL API route.
 * CLIENT-SAFE - can be used in React components and hooks.
 */
export async function translateBatchWithDeepL(
  texts: string[],
  targetLang: SupportedLocale,
  options: TranslateOptions = {}
): Promise<DeepLTranslationResult> {
  const response = await fetch('/api/i18n/translate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      targetLang,
      options,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepL batch translation failed: ${error}`);
  }

  return response.json();
}
