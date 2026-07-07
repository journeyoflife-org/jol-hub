// =============================================================================
// JOL-HUB Country Guard Component
// GDPR Article 44: Visual and functional data residency enforcement
// Lithuanian admin cannot see Latvian data - strict boundary
// Like a "border checkpoint" on screen - blocks cross-border access attempts
// =============================================================================

'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGDPR, useCountry } from '@/hooks';
import { AlertTriangle, AlertCircle, Shield, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EU_COUNTRIES } from '@/lib/countries';

interface CountryGuardProps {
  children: ReactNode;
  targetCountry?: string;
  fallbackPath?: string;
  showWatermark?: boolean;
}

export function CountryGuard({
  children,
  targetCountry,
  fallbackPath = '/dashboard',
  showWatermark = true,
}: CountryGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { enforceDataResidency, dataResidencyEnforced, allowedCountries } = useGDPR();
  const { countryCode, currentCountry } = useCountry();
  
  // Get the actual country code from the context
  const userCountryCode = countryCode || currentCountry?.code || null;

  // Track if we're currently blocking access
  const [isBlocked, setIsBlocked] = useState(false);
  const [attemptedCountry, setAttemptedCountry] = useState<string | null>(null);

  // Get the full country info for watermark display
  const countryInfo = EU_COUNTRIES.find((c) => c.code === userCountryCode) || {
    code: userCountryCode || 'eu',
    name: 'European Union',
    flag: '🇪🇺',
  };

  // GDPR Article 44: Validate data residency access
  useEffect(() => {
    if (targetCountry && dataResidencyEnforced) {
      const allowed = enforceDataResidency(targetCountry);
      if (!allowed) {
        console.warn(
          `[GDPR-44] Access denied: User from ${userCountryCode} attempted to access ${targetCountry}`
        );
        setAttemptedCountry(targetCountry);
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
        setAttemptedCountry(null);
      }
    }
  }, [targetCountry, dataResidencyEnforced, enforceDataResidency, userCountryCode, pathname]);

  // Detect URL-based cross-border access attempts (hacking prevention)
  useEffect(() => {
    // Check if URL contains country parameter that doesn't match user's country
    const urlParams = new URLSearchParams(window.location.search);
    const urlCountry = urlParams.get('country');

    if (urlCountry && urlCountry !== userCountryCode && userCountryCode !== null) {
      // User is trying to access data from another country via URL manipulation
      console.warn(
        `[GDPR-44] Blocked URL manipulation attempt: ${urlCountry} from ${userCountryCode}`
      );
      setAttemptedCountry(urlCountry);
      setIsBlocked(true);
    }
  }, [pathname, userCountryCode]);

  // Handle navigation back to safe area
  const handleReturnToSafeArea = () => {
    setIsBlocked(false);
    setAttemptedCountry(null);
    router.push(fallbackPath);
  };

  // Get attempted country info for display
  const attemptedCountryInfo = attemptedCountry
    ? EU_COUNTRIES.find((c) => c.code === attemptedCountry)
    : null;

  // Render blocked overlay - GDPR Article 44 violation prevented
  if (isBlocked) {
    return (
      <div className="relative min-h-screen">
        {/* Full-screen red overlay blocking all content */}
        <div className="fixed inset-0 bg-red-900/95 z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-md text-center shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
            <p className="text-gray-700 mb-4">
              You are attempting to access data outside your authorized jurisdiction
              ({countryInfo.name}).
            </p>
            {attemptedCountryInfo && (
              <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-100 rounded">
                Attempted access to:{' '}
                <span className="font-bold">
                  {attemptedCountryInfo.flag} {attemptedCountryInfo.name}
                </span>
              </p>
            )}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
                <Lock className="h-3 w-3" />
                GDPR Article 44 Violation Prevented
              </p>
            </div>
            <Button
              onClick={handleReturnToSafeArea}
              className="bg-red-600 hover:bg-red-700"
            >
              Return to Authorized Area
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check for country access restriction (non-blocking warning)
  const showWarning = targetCountry &&
    dataResidencyEnforced &&
    !allowedCountries.includes(targetCountry) &&
    !isBlocked;

  if (showWarning) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                Access Restricted
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                GDPR Article 44 restricts cross-border data access.
                Your current context does not permit access to {targetCountry} data.
              </p>
            </div>
            <Button onClick={() => router.push(fallbackPath)}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal render with watermark
  return (
    <div className="relative min-h-screen">
      {/* GDPR Article 44 Watermark - Visual enforcement */}
      {showWatermark && userCountryCode && (
        <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{countryInfo.flag}</span>
              <div>
                <p className="font-bold text-blue-900 text-sm">{countryInfo.name}</p>
                <p className="text-xs text-gray-600">
                  Data Residency: {countryInfo.code.toUpperCase()}
                </p>
                <p className="text-xs text-green-600 font-mono flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  GDPR Art. 44 ENFORCED
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      {children}
    </div>
  );
}
