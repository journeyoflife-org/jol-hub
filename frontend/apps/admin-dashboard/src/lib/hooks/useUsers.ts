// =============================================================================
// JOL-HUB User Hooks
// TanStack Query hooks for user management
// =============================================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminRole } from '@/types';

// Types for user data
interface User {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  country: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface UserListResponse {
  users: User[];
  total: number;
}

// API fetch functions
async function fetchUsers(params: {
  search?: string;
  country?: string;
  role?: string;
}): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.country) searchParams.set('country', params.country);
  if (params.role) searchParams.set('role', params.role);

  const response = await fetch(`/api/users?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

async function fetchRoles(): Promise<Role[]> {
  const response = await fetch('/api/roles');
  if (!response.ok) throw new Error('Failed to fetch roles');
  return response.json();
}

// Hook for fetching user list
export function useUsers(params: {
  search?: string;
  country?: string;
  role?: string;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
    staleTime: 30000,
  });
}

// Hook for fetching roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 300000, // Roles rarely change
  });
}
