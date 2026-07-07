// =============================================================================
// JOL-HUB Bitrix24 Integration Hook
// Real-time sync with circuit breaker pattern
// =============================================================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { 
  Bitrix24SyncStatus, 
  Bitrix24SyncJob, 
  Bitrix24Health,
  SyncableEntity,
} from '@/types';

const POLL_INTERVAL = 5000;

// API fetch functions
async function fetchSyncStatus(): Promise<Bitrix24SyncStatus> {
  const response = await fetch('/api/bitrix24/status');
  if (!response.ok) throw new Error('Failed to fetch sync status');
  return response.json();
}

async function fetchEntitySyncStatus(entityId: string): Promise<Bitrix24SyncStatus> {
  const response = await fetch(`/api/bitrix24/status/${entityId}`);
  if (!response.ok) throw new Error('Failed to fetch entity sync status');
  return response.json();
}

async function fetchSyncJobs(): Promise<Bitrix24SyncJob[]> {
  const response = await fetch('/api/bitrix24/jobs');
  if (!response.ok) throw new Error('Failed to fetch sync jobs');
  return response.json();
}

async function fetchHealth(): Promise<Bitrix24Health> {
  const response = await fetch('/api/bitrix24/health');
  if (!response.ok) throw new Error('Failed to fetch health');
  return response.json();
}

interface Bitrix24Context {
  status: Bitrix24SyncStatus | null;
  jobs: Bitrix24SyncJob[];
  health: Bitrix24Health | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  syncEntity: (entityType: SyncableEntity, entityId: string) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => Promise<void>;
  retryFailedJobs: () => Promise<void>;
}

export function useBitrix24(entityId?: string): Bitrix24Context & { syncNow: () => void; refetch: () => void } {
  const queryClient = useQueryClient();

  // Poll sync status
  const { data: status, isLoading: statusLoading, error: statusError, refetch } = useQuery({
    queryKey: ['bitrix24', 'status', entityId],
    queryFn: () => entityId ? fetchEntitySyncStatus(entityId) : fetchSyncStatus(),
    refetchInterval: POLL_INTERVAL,
    staleTime: 2000,
  });

  // Sync now mutation
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) return;
      const response = await fetch(`/api/bitrix24/sync/${entityId}`, { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24'] });
    },
  });

  const syncNow = () => {
    syncNowMutation.mutate();
  };

  // Poll sync jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['bitrix24', 'jobs'],
    queryFn: fetchSyncJobs,
    refetchInterval: POLL_INTERVAL,
    staleTime: 2000,
  });

  // Poll health status
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['bitrix24', 'health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Sync entity mutation
  const syncMutation = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: SyncableEntity; entityId: string }) => {
      const response = await fetch('/api/bitrix24/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24'] });
    },
  });

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: async ({ conflictId, resolution }: { conflictId: string; resolution: 'local' | 'remote' }) => {
      const response = await fetch(`/api/bitrix24/conflicts/${conflictId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      if (!response.ok) throw new Error('Failed to resolve conflict');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24'] });
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bitrix24/retry', { method: 'POST' });
      if (!response.ok) throw new Error('Retry failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24'] });
    },
  });

  // Sync entity action
  const syncEntity = useCallback(
    async (entityType: SyncableEntity, entityId: string) => {
      await syncMutation.mutateAsync({ entityType, entityId });
    },
    [syncMutation]
  );

  // Resolve conflict action
  const resolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'remote') => {
      await resolveConflictMutation.mutateAsync({ conflictId, resolution });
    },
    [resolveConflictMutation]
  );

  // Retry failed jobs action
  const retryFailedJobs = useCallback(async () => {
    await retryMutation.mutateAsync();
  }, [retryMutation]);

  return {
    status: status ?? null,
    jobs,
    health: health ?? null,
    isLoading: statusLoading || jobsLoading || healthLoading,
    error: statusError as Error | null,
    syncEntity,
    resolveConflict,
    retryFailedJobs,
    syncNow,
    refetch: () => refetch(),
  };
}

// Real-time webhook connection hook
export function useBitrix24Realtime() {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // SSE connection for real-time updates
    const eventSource = new EventSource('/api/bitrix24/stream');

    eventSource.onopen = () => setConnected(true);
    eventSource.addEventListener('close', () => setConnected(false));
    eventSource.onerror = () => setConnected(false);

    eventSource.onmessage = () => {
      setLastUpdate(new Date());
    };

    return () => eventSource.close();
  }, []);

  return { connected, lastUpdate };
}
