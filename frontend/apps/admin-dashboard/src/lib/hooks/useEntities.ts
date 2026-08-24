// =============================================================================
// JOL-HUB Entity Hooks
// TanStack Query hooks for entity data fetching
// =============================================================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Entity, EntityListResponse } from '@/types';

// API fetch functions
async function fetchEntities(params: {
  country?: string;
  type?: string;
  status?: string;
  search?: string;
}): Promise<EntityListResponse<Entity>> {
  const searchParams = new URLSearchParams();
  if (params.country) searchParams.set('country', params.country);
  if (params.type) searchParams.set('type', params.type);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  const response = await fetch(`/api/entities?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch entities');
  return response.json();
}

async function fetchEntity(id: string): Promise<Entity> {
  const response = await fetch(`/api/entities/${id}`);
  if (!response.ok) throw new Error('Failed to fetch entity');
  return response.json();
}

async function approveEntity(params: {
  entityId: string;
  approvalData: Record<string, unknown>;
}): Promise<void> {
  const response = await fetch(`/api/entities/${params.entityId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.approvalData),
  });
  if (!response.ok) throw new Error('Failed to approve entity');
}

async function verifyEntity(params: {
  entityId: string;
  verificationData: Record<string, unknown>;
}): Promise<void> {
  const response = await fetch(`/api/entities/${params.entityId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.verificationData),
  });
  if (!response.ok) throw new Error('Failed to verify entity');
}

// Hook for fetching entity list
export function useEntities(params: {
  country?: string;
  type?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['entities', params],
    queryFn: () => fetchEntities(params),
    staleTime: 30000,
  });
}

// Hook for fetching single entity
export function useEntity(id: string) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => fetchEntity(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

// Hook for approving an entity
export function useApproveEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['entity'] });
    },
  });
}

// Hook for verifying an entity
export function useVerifyEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: verifyEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['entity'] });
    },
  });
}
