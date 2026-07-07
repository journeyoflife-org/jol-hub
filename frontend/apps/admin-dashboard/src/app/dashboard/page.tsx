'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Church,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { useDashboardStats, useRecentActivity, useAnalyticsOverview } from '@/lib/hooks';
import { AreaChartComponent } from '@/components/charts';
import { CHART_COLORS } from '@/components/charts';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: overview } = useAnalyticsOverview('7d');

  // Transform data for mini chart
  const growthChartData = overview?.parishes?.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    parishes: item.count,
    users: overview.users?.[index]?.count ?? 0,
  })) ?? [];

  if (statsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-6">
        <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">Failed to load dashboard</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Unable to fetch dashboard statistics. Please try again.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of JOL-HUB platform activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parishes</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalParishes ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats?.activeParishes ?? 0)} active
            </p>
            <Progress
              value={stats?.totalParishes ? ((stats?.activeParishes ?? 0) / stats.totalParishes) * 100 : 0}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalUsers ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats?.activeUsers ?? 0)} active this month
            </p>
            <Progress
              value={stats?.totalUsers ? ((stats?.activeUsers ?? 0) / stats.totalUsers) * 100 : 0}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Donations</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyDonations ?? 0)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{(stats?.donationGrowth ?? 0).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.countries ?? 27}</div>
            <p className="text-xs text-muted-foreground">
              EU member states covered
            </p>
            <Progress value={100} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {(stats?.pendingApproval ?? 0) > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {stats?.pendingApproval} parishes pending approval
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Review and approve new parish registrations
              </p>
            </div>
            <a href="/dashboard/entities?status=pending" className="text-sm font-medium text-yellow-700 hover:underline">
              View all →
            </a>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${
                      item.type === 'parish_approved' ? 'bg-green-500' :
                      item.type === 'parish_pending' ? 'bg-yellow-500' :
                      item.type === 'donation' ? 'bg-blue-500' :
                      item.type === 'security_alert' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend (7 Days)</CardTitle>
            <CardDescription>Parishes and users registration</CardDescription>
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
                height={200}
                showLegend={true}
                formatter={(value) => formatNumber(value)}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground">All systems running normally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Average Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResponseTime ?? 0}ms</div>
            <p className="text-xs text-muted-foreground">API latency (p95)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Monthly Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8.3%</div>
            <p className="text-xs text-muted-foreground">New parish registrations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
