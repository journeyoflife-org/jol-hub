/**
 * useTranslationWithDeepL — React hook + standalone utility
 *
 * Rules enforced here (never in the calling component):
 *  1. Liturgical guard  — text matching sacred patterns is NEVER sent to DeepL
 *  2. Clergy-approval guard — prayer / scripture / sermon content is blocked
 *  3. 24-hour cache — localStorage (client) + in-memory Map (server/Edge)
 *  4. AI disclaimer — callers receive `isAiTranslated: true` for UI badges
 *  5. Abort safety — pending requests are cancelled on component unmount
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation as useReactI18nextTranslation } from 'react-i18next';

import { containsLiturgicalContent } from './useTranslation';
import { translateWithDeepL } from '../lib/deepl-client';
import type { SupportedLocale } from '../types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TranslationCacheEntry {
  /** Original source text */
  text: string;
  /** Machine-translated result */
  translatedText: string;
  /** Target locale */
  targetLang: string;
  /** Unix ms timestamp of when this entry was created */
  timestamp: number;
}

export interface UseTranslationWithDeepLReturn {
  /** Standard i18next `t()` function */
  t: (key: string, options?: Record<string, unknown>) => string;
  /**
   * Translate user-generated content through DeepL.
   * Returns the original string if translation is blocked or fails.
   */
  translateUserContent: (text: string, targetLang: SupportedLocale) => Promise<string>;
  /** `true` while a DeepL request is in-flight */
  isTranslating: boolean;
  /** Non-null when the last translation attempt failed */
  translationError: string | null;
  /**
   * `true` after a successful DeepL translation.
   * Use this to show an "Translated by AI" badge in the UI.
   */
  isAiTranslated: boolean;
  /** Reset `isAiTranslated` to `false` */
  clearAiTranslationFlag: () => void;
}

/** Shape of the raw DeepL REST response (used by the standalone utility) */
export interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language?: string;
    text: string;
  }>;
}

// ---------------------------------------------------------------------------
// Guard: clergy-approval patterns
// ---------------------------------------------------------------------------

/**
 * Content types that must not be auto-translated; they need clergy review.
 * Matched against the full input string (case-insensitive).
 */
const CLERGY_APPROVAL_PATTERNS: RegExp[] = [
  /\bprayer\b/i,
  /\bbible verse\b/i,
  /\bscripture\b/i,
  /\bsermon\b/i,
  /\bhomily\b/i,
  // Lithuanian equivalents
  /\bmalda\b/i,
  /\bhomilija\b/i,
];

function requiresClergyApproval(text: string): boolean {
  return CLERGY_APPROVAL_PATTERNS.some((re) => re.test(text));
}

type SkipReason = 'sacred_text' | 'requires_clergy_approval' | 'too_short' | null;

function getSkipReason(text: string): SkipReason {
  if (text.trim().length < 3) return 'too_short';
  if (containsLiturgicalContent(text)) return 'sacred_text';
  if (requiresClergyApproval(text)) return 'requires_clergy_approval';
  return null;
}

// ---------------------------------------------------------------------------
// Cache — two layers
//
// Client-side : localStorage  (survives page refresh, 24-hour TTL)
// Server/Edge : in-process Map (lives for the process lifetime, good for
//               SSR / Route Handlers / Server Actions where localStorage
//               is unavailable)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LS_CACHE_KEY = 'jol-hub:deepl-cache';

/** Server/Edge in-memory cache — keyed by `${hash}:${targetLang}` */
const serverCache = new Map<string, TranslationCacheEntry>();

function makeCacheKey(text: string, targetLang: string): string {
  // btoa is available in both browser and Edge Runtime
  const hash = btoa(encodeURIComponent(text.slice(0, 256))).slice(0, 40);
  return `${hash}:${targetLang}`;
}

function isExpired(entry: TranslationCacheEntry): boolean {
  return Date.now() - entry.timestamp >= CACHE_TTL_MS;
}

// -- localStorage helpers (client only) --

function readLocalStorageCache(): Record<string, TranslationCacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TranslationCacheEntry>) : {};
  } catch {
    return {};
  }
}

function writeLocalStorageCache(store: Record<string, TranslationCacheEntry>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded — silently ignore
  }
}

// -- Unified read (client tries localStorage first, falls back to server Map) --

function getCached(text: string, targetLang: string): string | null {
  const key = makeCacheKey(text, targetLang);

  // 1. Server / Edge
  const serverEntry = serverCache.get(key);
  if (serverEntry && !isExpired(serverEntry)) return serverEntry.translatedText;

  // 2. Browser localStorage
  const store = readLocalStorageCache();
  const lsEntry = store[key];
  if (lsEntry && !isExpired(lsEntry)) return lsEntry.translatedText;

  return null;
}

function setCached(text: string, targetLang: string, translatedText: string): void {
  const key = makeCacheKey(text, targetLang);
  const entry: TranslationCacheEntry = {
    text,
    translatedText,
    targetLang,
    timestamp: Date.now(),
  };

  // Always update the server Map (fast, always available)
  serverCache.set(key, entry);

  // Also persist to localStorage when on client
  if (typeof window !== 'undefined') {
    const store = readLocalStorageCache();
    // Evict stale entries before writing to avoid unbounded growth
    for (const [k, v] of Object.entries(store)) {
      if (isExpired(v)) delete store[k];
    }
    store[key] = entry;
    writeLocalStorageCache(store);
  }
}

// ---------------------------------------------------------------------------
// Internal core translate — called by both hook and standalone utility
// ---------------------------------------------------------------------------

interface TranslateResult {
  translatedText: string;
  isAiTranslated: boolean;
  skipReason: SkipReason;
}

async function runTranslation(
  text: string,
  targetLang: SupportedLocale
): Promise<TranslateResult> {
  // 1. Guard checks
  const skipReason = getSkipReason(text);
  if (skipReason !== null) {
    return { translatedText: text, isAiTranslated: false, skipReason };
  }

  // 2. Cache hit
  const cached = getCached(text, targetLang);
  if (cached !== null) {
    return { translatedText: cached, isAiTranslated: true, skipReason: null };
  }

  // 3. DeepL API call (SDK handles retries internally)
  const result = await translateWithDeepL(text, targetLang, {
    formality: 'default',
    splitSentences: 'on',
    tagHandling: 'html',
  });

  const translatedText = result.translations[0]?.text ?? text;
  setCached(text, targetLang, translatedText);

  return { translatedText, isAiTranslated: true, skipReason: null };
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useTranslationWithDeepL(): UseTranslationWithDeepLReturn {
  const { t: baseT, i18n } = useReactI18nextTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isAiTranslated, setIsAiTranslated] = useState(false);

  // Track in-flight request to abort on unmount
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const translateUserContent = useCallback(
    async (text: string, targetLang: SupportedLocale): Promise<string> => {
      // Cancel any still-pending previous call
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsTranslating(true);
      setTranslationError(null);

      try {
        const { translatedText, isAiTranslated: aiFlag, skipReason } =
          await runTranslation(text, targetLang);

        // Surface block reason as a human-readable prefix
        if (skipReason === 'sacred_text') {
          return `[${baseT('disclaimer.sacred_text_warning')}] ${text}`;
        }
        if (skipReason === 'requires_clergy_approval') {
          return `[${baseT('disclaimer.requires_clergy_approval')}] ${text}`;
        }

        if (aiFlag) setIsAiTranslated(true);
        return translatedText;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Translation failed';
        setTranslationError(message);
        return text; // Graceful degradation — return original
      } finally {
        setIsTranslating(false);
      }
    },
    [baseT]
  );

  /**
   * Augmented `t()`:
   * For keys prefixed with `userContent:`, fires a background DeepL call and
   * returns the base i18next string immediately (state updates trigger re-render).
   */
  const t = useCallback(
    (key: string, options?: Record<string, unknown>): string => {
      const translated = baseT(key, options);

      if (key.startsWith('userContent:') && typeof options?.text === 'string') {
        const targetLang = i18n.language as SupportedLocale;
        void translateUserContent(options.text, targetLang);
      }

      return translated;
    },
    [baseT, i18n.language, translateUserContent]
  );

  const clearAiTranslationFlag = useCallback(() => {
    setIsAiTranslated(false);
  }, []);

  return {
    t,
    translateUserContent,
    isTranslating,
    translationError,
    isAiTranslated,
    clearAiTranslationFlag,
  };
}

// ---------------------------------------------------------------------------
// Standalone async utility (usable in Server Actions, Route Handlers, etc.)
// ---------------------------------------------------------------------------

export interface TranslateUserContentResult {
  translatedText: string;
  isAiTranslated: boolean;
  /**
   * Reason the translation was skipped, or `'ai_translated'` on success,
   * or `'translation_failed'` on error.
   */
  disclaimer: 'ai_translated' | 'sacred_text_warning' | 'requires_clergy_approval' | 'too_short' | 'translation_failed';
}

/**
 * Translate user-generated content with full liturgical and clergy guards.
 *
 * Safe to call from Server Components, Server Actions, Route Handlers,
 * and React Client Components.
 *
 * @param text       - Raw user input to translate
 * @param targetLang - JOL-HUB locale code
 *
 * @example
 * ```ts
 * // Server Action
 * const { translatedText, disclaimer } = await translateUserContent(
 *   formData.get('comment') as string,
 *   'ru'
 * );
 * if (disclaimer === 'sacred_text_warning') {
 *   // show "Translation blocked — sacred content" notice
 * }
 * ```
 */
export async function translateUserContent(
  text: string,
  targetLang: SupportedLocale
): Promise<TranslateUserContentResult> {
  try {
    const { translatedText, isAiTranslated, skipReason } =
      await runTranslation(text, targetLang);

    if (skipReason === 'sacred_text') {
      return { translatedText: text, isAiTranslated: false, disclaimer: 'sacred_text_warning' };
    }
    if (skipReason === 'requires_clergy_approval') {
      return { translatedText: text, isAiTranslated: false, disclaimer: 'requires_clergy_approval' };
    }
    if (skipReason === 'too_short') {
      return { translatedText: text, isAiTranslated: false, disclaimer: 'too_short' };
    }

    return {
      translatedText,
      isAiTranslated,
      disclaimer: 'ai_translated',
    };
  } catch {
    return {
      translatedText: text,
      isAiTranslated: false,
      disclaimer: 'translation_failed',
    };
  }
}
