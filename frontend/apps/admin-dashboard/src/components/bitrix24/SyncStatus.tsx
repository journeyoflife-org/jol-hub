'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import { useBitrix24 } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// =============================================================================
// Bitrix24 Sync Status Component
// Real-time health indicator for CRM synchronization
// Circuit breaker state visualization
// =============================================================================

interface SyncStatusProps {
  entityId?: string;
}

export function SyncStatus({ entityId }: SyncStatusProps) {
  const { status, isLoading, error, refetch, syncNow } = useBitrix24(entityId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to load sync status</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const circuitBreakerState = status?.circuitBreakerState;
  const isHealthy = circuitBreakerState?.status === 'closed';
  const isOpen = circuitBreakerState?.status === 'open';
  const isHalfOpen = circuitBreakerState?.status === 'half-open';

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bitrix24 Connection</CardTitle>
              <CardDescription>CRM synchronization status</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => syncNow()} disabled={isOpen}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                isHealthy ? 'bg-green-500' : isOpen ? 'bg-red-500' : 'bg-yellow-500'
              )}
            />
            <div>
              <p className="font-medium">
                {isHealthy ? 'Connected' : isOpen ? 'Disconnected' : 'Reconnecting...'}
              </p>
              <p className="text-sm text-muted-foreground">
                {status?.lastSync
                  ? `Last sync: ${formatDistanceToNow(new Date(status.lastSync), { addSuffix: true })}`
                  : 'No sync recorded'}
              </p>
            </div>
            <Badge
              variant={isHealthy ? 'default' : 'destructive'}
              className={cn(
                isHealthy && 'bg-green-100 text-green-800',
                isOpen && 'bg-red-100 text-red-800',
                isHalfOpen && 'bg-yellow-100 text-yellow-800'
              )}
            >
              {circuitBreakerState?.status?.toUpperCase() ?? 'UNKNOWN'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sync Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Successful Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {status?.successCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {status?.failureCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.pendingItems ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">In sync queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Circuit Breaker Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Circuit Breaker State</CardTitle>
          <CardDescription>
            Real-time sync health monitoring with automatic failover
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                className={cn(
                  isHealthy && 'bg-green-100 text-green-800',
                  isOpen && 'bg-red-100 text-red-800',
                  isHalfOpen && 'bg-yellow-100 text-yellow-800'
                )}
              >
                {isHealthy && <CheckCircle className="h-3 w-3 mr-1" />}
                {isOpen && <XCircle className="h-3 w-3 mr-1" />}
                {isHalfOpen && <AlertTriangle className="h-3 w-3 mr-1" />}
                {circuitBreakerState?.status?.toUpperCase() ?? 'UNKNOWN'}
              </Badge>
            </div>

            {circuitBreakerState?.failureCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failure Count</span>
                <span className="font-medium">{circuitBreakerState.failureCount}</span>
              </div>
            )}

            {circuitBreakerState?.lastFailure && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Failure</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(circuitBreakerState.lastFailure), { addSuffix: true })}
                </span>
              </div>
            )}

            {isOpen && circuitBreakerState?.resetTimeout && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Retry In</span>
                <span className="font-medium">
                  {Math.round(circuitBreakerState.resetTimeout / 1000)}s
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            Latest synchronization events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.recentActivity && status.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {status.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 h-2 w-2 rounded-full',
                      activity.success ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No recent sync activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
