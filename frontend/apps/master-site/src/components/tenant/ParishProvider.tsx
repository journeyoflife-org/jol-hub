/**
 * React Context for parish data in multi-tenant JOL-HUB.
 * 
 * Provides parish configuration throughout the component tree
 * for [parish] dynamic routes.
 * 
 * DATA ISOLATION: Each parish context is isolated to prevent
 * cross-parish data leakage.
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ParishConfig } from '@/lib/tenant/config';

// =============================================================================
// CONTEXT TYPE
// =============================================================================

/**
 * Parish context value interface.
 */
interface ParishContextValue {
  /** Parish configuration */
  parish: ParishConfig;
  /** Whether this is a valid parish context */
  isValid: true;
}

/**
 * Null parish context (when not in a parish route).
 */
interface NullParishContextValue {
  parish: null;
  isValid: false;
}

/** Combined context type */
type ParishContextType = ParishContextValue | NullParishContextValue;

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * React Context for parish data.
 * 
 * Default value is null context (for non-parish routes).
 */
const ParishContext = createContext<ParishContextType>({
  parish: null,
  isValid: false,
});

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * Props for ParishProvider component.
 */
interface ParishProviderProps {
  /** Parish configuration */
  parish: ParishConfig;
  /** Child components */
  children: ReactNode;
}

/**
 * Parish Provider Component.
 * 
 * Wraps children with parish context, making parish data
 * available throughout the component tree.
 * 
 * @example
 * ```tsx
 * // In [parish]/layout.tsx
 * <ParishProvider parish={parishConfig}>
 *   {children}
 * </ParishProvider>
 * ```
 */
export function ParishProvider({ parish, children }: ParishProviderProps) {
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<ParishContextValue>(
    () => ({
      parish,
      isValid: true,
    }),
    [parish]
  );

  return (
    <ParishContext.Provider value={value}>
      {children}
    </ParishContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access parish context.
 * 
 * Must be used within a ParishProvider. Throws error if used
 * outside of parish context.
 * 
 * @example
 * ```tsx
 * function ParishHeader() {
 *   const { parish } = useParish();
 *   return <h1>{parish.name}</h1>;
 * }
 * ```
 * 
 * @returns Parish context value
 * @throws Error if used outside ParishProvider
 */
export function useParish(): ParishConfig {
  const context = useContext(ParishContext);

  if (!context.isValid || !context.parish) {
    throw new Error(
      'useParish must be used within a ParishProvider. ' +
      'Make sure you are in a [parish] route.'
    );
  }

  return context.parish;
}

/**
 * Hook to safely access parish context (returns null if not in parish).
 * 
 * Use this when a component might be used both inside and outside
 * parish routes.
 * 
 * @example
 * ```tsx
 * function MaybeParishComponent() {
 *   const parish = useParishSafe();
 *   if (parish) {
 *     return <div>Welcome to {parish.name}</div>;
 *   }
 *   return <div>Welcome to JOL-HUB</div>;
 * }
 * ```
 * 
 * @returns Parish config or null
 */
export function useParishSafe(): ParishConfig | null {
  const context = useContext(ParishContext);
  return context.isValid ? context.parish : null;
}

/**
 * Hook to check if currently in a parish context.
 * 
 * @example
 * ```tsx
 * function ConditionalComponent() {
 *   const isInParish = useIsInParish();
 *   return isInParish ? <ParishNav /> : <MasterNav />;
 * }
 * ```
 * 
 * @returns True if in parish context
 */
export function useIsInParish(): boolean {
  const context = useContext(ParishContext);
  return context.isValid;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get parish-specific localStorage key.
 * 
 * Ensures data isolation between parishes by prefixing keys
 * with parish ID.
 * 
 * @example
 * ```tsx
 * function UserPreferences() {
 *   const getKey = useParishStorageKey();
 *   const key = getKey('user-preferences');
 *   // key = "parish:stmarys:user-preferences"
 *   
 *   useEffect(() => {
 *     localStorage.setItem(key, JSON.stringify(prefs));
 *   }, [key, prefs]);
 * }
 * ```
 * 
 * @returns Function to generate parish-prefixed storage keys
 */
export function useParishStorageKey(): (key: string) => string {
  const parish = useParishSafe();

  return (key: string): string => {
    if (!parish) {
      // Fallback for non-parish contexts
      return `master:${key}`;
    }
    return `parish:${parish.id}:${key}`;
  };
}

/**
 * Hook to get parish-specific API headers.
 * 
 * Automatically includes x-parish-subdomain header for
 * Django backend data isolation.
 * 
 * @example
 * ```tsx
 * function ParishData() {
 *   const headers = useParishApiHeaders();
 *   
 *   useEffect(() => {
 *     fetch('/api/announcements', { headers })
 *       .then(res => res.json())
 *       .then(setData);
 *   }, [headers]);
 * }
 * ```
 * 
 * @returns Headers object with parish context
 */
export function useParishApiHeaders(): Record<string, string> {
  const parish = useParishSafe();

  return useMemo(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (parish) {
      headers['x-parish-subdomain'] = parish.subdomain;
      headers['x-parish-id'] = parish.id;
      headers['x-diocese-id'] = parish.dioceseId;
    }

    return headers;
  }, [parish]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ParishContextValue, ParishProviderProps };
export { ParishContext };
