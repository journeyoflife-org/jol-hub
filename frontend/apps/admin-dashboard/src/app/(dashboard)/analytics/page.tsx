'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChartComponent, BarChartComponent, PieChartComponent } from '@/components/charts';
import { CHART_COLORS } from '@/components/charts';
import { useAnalyticsOverview, useEntityAnalytics, useDonationAnalytics } from '@/lib/hooks';
import { formatNumber, formatCurrency } from '@/lib/utils';
import {
  Users,
  Church,
  CreditCard,
  Globe,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { EU_COUNTRIES } from '@/lib/countries';

// =============================================================================
// Analytics Page
// Aggregated data only - GDPR Article 44 compliant analytics
// No PII displayed, only aggregated metrics per country/region
// =============================================================================

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  const { data: overview, refetch } = useAnalyticsOverview(timeRange);
  const { data: entities } = useEntityAnalytics(timeRange, selectedCountry);
  const { data: donations } = useDonationAnalytics(timeRange, selectedCountry);

  // Compute derived stats from API data
  const totalParishes = overview?.parishes?.reduce((sum, p) => sum + p.count, 0) ?? 0;
  const totalUsers = overview?.users?.reduce((sum, u) => sum + u.count, 0) ?? 0;
  const totalDonations = overview?.donations?.reduce((sum, d) => sum + d.amount, 0) ?? 0;

  // Transform data for charts
  const growthChartData = overview?.parishes?.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    parishes: item.count,
    users: overview.users?.[index]?.count ?? 0,
    donations: overview.donations?.[index]?.amount ?? 0,
  })) ?? [];

  const entityDistributionData = entities?.byType?.map((item, index) => ({
    name: item.type,
    value: item.count,
    color: CHART_COLORS.colors[index % CHART_COLORS.colors.length],
  })) ?? [];

  const countryData = entities?.byCountry?.map((item) => ({
    country: item.country,
    parishes: item.parishCount,
    users: item.userCount,
  })) ?? [];

  const donationByCountryData = donations?.byCountry?.map((item) => ({
    country: item.country,
    amount: item.totalAmount,
    transactions: item.transactionCount,
  })) ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Aggregated platform metrics • GDPR Article 44 compliant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={(v: string) => setTimeRange(v as typeof timeRange)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {EU_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalParishes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Parishes registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDonations)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{EU_COUNTRIES.length}</div>
            <p className="text-xs text-muted-foreground">
              EU member states
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trend</CardTitle>
                <CardDescription>Platform growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                {growthChartData.length > 0 ? (
                  <AreaChartComponent
                    data={growthChartData}
                    xKey="date"
                    areas={[
                      { key: 'parishes', name: 'Parishes', color: CHART_COLORS.colors[0] },
                      { key: 'users', name: 'Users', color: CHART_COLORS.colors[1] },
                    ]}
                    height={300}
                    showLegend={true}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entity Distribution</CardTitle>
                <CardDescription>Breakdown by entity type</CardDescription>
              </CardHeader>
              <CardContent>
                {entityDistributionData.length > 0 ? (
                  <PieChartComponent
                    data={entityDistributionData}
                    height={300}
                    showLegend={true}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Statistics</CardTitle>
              <CardDescription>Detailed entity metrics by type and status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed entity analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Donation Statistics</CardTitle>
              <CardDescription>Donation trends and breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {donationByCountryData.length > 0 ? (
                <BarChartComponent
                  data={donationByCountryData}
                  xKey="country"
                  bars={[
                    { key: 'amount', name: 'Amount (€)', color: CHART_COLORS.colors[0] },
                  ]}
                  height={300}
                  showLegend={true}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Entity distribution by country</CardDescription>
            </CardHeader>
            <CardContent>
              {countryData.length > 0 ? (
                <BarChartComponent
                  data={countryData}
                  xKey="country"
                  bars={[
                    { key: 'parishes', name: 'Parishes', color: CHART_COLORS.colors[0] },
                    { key: 'users', name: 'Users', color: CHART_COLORS.colors[1] },
                  ]}
                  height={300}
                  showLegend={true}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* GDPR Notice */}
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>GDPR Article 44 Compliance:</strong> All analytics data shown on this page is 
            aggregated and anonymized. No personally identifiable information (PII) is displayed. 
            Data is scoped by country to ensure data residency compliance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
