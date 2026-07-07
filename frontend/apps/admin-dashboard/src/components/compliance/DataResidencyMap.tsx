'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Lock,
  Unlock,
  Shield,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { EU_COUNTRIES } from '@/lib/countries';
import { cn } from '@/lib/utils';

// =============================================================================
// Data Residency Map Component
// Visual EU map with locks per country
// GDPR Article 44: Data residency enforcement visualization
// =============================================================================

interface CountryResidencyStatus {
  code: string;
  locked: boolean;
  entityCount: number;
  userCount: number;
  lastSync: string;
  complianceScore: number;
  dataCenter: string;
}

interface DataResidencyMapProps {
  data?: CountryResidencyStatus[];
  onCountryClick?: (countryCode: string) => void;
}

export function DataResidencyMap({
  data,
  onCountryClick,
}: DataResidencyMapProps) {
  // Generate mock data if not provided
  const residencyData = useMemo(() => {
    if (data) return data;
    return EU_COUNTRIES.map((country) => ({
      code: country.code,
      locked: true,
      entityCount: Math.floor(Math.random() * 500) + 50,
      userCount: Math.floor(Math.random() * 5000) + 100,
      lastSync: new Date().toISOString(),
      complianceScore: Math.floor(Math.random() * 20) + 80,
      dataCenter: `EU-${country.code}`,
    }));
  }, [data]);

  const stats = useMemo(() => {
    const totalEntities = residencyData.reduce((sum, c) => sum + c.entityCount, 0);
    const totalUsers = residencyData.reduce((sum, c) => sum + c.userCount, 0);
    const lockedCountries = residencyData.filter((c) => c.locked).length;
    const avgCompliance =
      residencyData.reduce((sum, c) => sum + c.complianceScore, 0) / residencyData.length;

    return {
      totalEntities,
      totalUsers,
      lockedCountries,
      totalCountries: residencyData.length,
      avgCompliance: Math.round(avgCompliance),
    };
  }, [residencyData]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Lock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lockedCountries}</p>
                <p className="text-sm text-muted-foreground">Countries Locked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCountries}</p>
                <p className="text-sm text-muted-foreground">Total Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgCompliance}%</p>
                <p className="text-sm text-muted-foreground">Avg Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <CheckCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEntities.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Protected Entities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Data Residency by Country</CardTitle>
          <CardDescription>
            GDPR Article 44: All data is locked within EU borders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {residencyData.map((country) => {
              const countryInfo = EU_COUNTRIES.find((c) => c.code === country.code);
              return (
                <div
                  key={country.code}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    country.locked
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                      : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                  )}
                  onClick={() => onCountryClick?.(country.code)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{countryInfo?.flag}</span>
                      <span className="font-medium">{countryInfo?.name}</span>
                    </div>
                    {country.locked ? (
                      <Lock className="h-4 w-4 text-green-600" />
                    ) : (
                      <Unlock className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entities:</span>
                      <span className="font-medium">{country.entityCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium">{country.userCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Center:</span>
                      <span className="font-mono text-xs">{country.dataCenter}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Compliance</span>
                      <span>{country.complianceScore}%</span>
                    </div>
                    <Progress
                      value={country.complianceScore}
                      className={cn(
                        'h-2',
                        country.complianceScore >= 90
                          ? '[&>div]:bg-green-500'
                          : country.complianceScore >= 70
                          ? '[&>div]:bg-yellow-500'
                          : '[&>div]:bg-red-500'
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* GDPR Notice */}
      <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                GDPR Article 44 Compliance
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                All data is processed and stored within the European Economic Area (EEA).
                Data transfers outside the EEA are prohibited unless covered by an adequacy
                decision or appropriate safeguards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
