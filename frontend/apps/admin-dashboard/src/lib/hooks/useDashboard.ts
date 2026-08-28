// =============================================================================
// JOL-HUB Dashboard Hooks
// TanStack Query hooks for dashboard data
// =============================================================================

'use client';

import { useQuery } from '@tanstack/react-query';

// Types for dashboard data
interface DashboardStats {
  totalParishes: number;
  activeParishes: number;
  pendingApproval: number;
  totalUsers: number;
  activeUsers: number;
  monthlyDonations: number;
  donationGrowth: number;
  countries: number;
  pageViews: number;
  avgResponseTime: number;
}

interface Activity {
  id: string;
  type: 'parish_approved' | 'parish_pending' | 'user_registered' | 'donation' | 'content_updated' | 'security_alert';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// API fetch functions
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
}

async function fetchRecentActivity(limit: number): Promise<Activity[]> {
  const response = await fetch(`/api/dashboard/activity?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch recent activity');
  return response.json();
}

// Hook for dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 60000,
  });
}

// Hook for recent activity
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30000,
  });
}

// Hook for country statistics
export function useCountryStats() {
  return useQuery({
    queryKey: ['dashboard', 'countries'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/countries');
      if (!response.ok) throw new Error('Failed to fetch country stats');
      return response.json();
    },
    staleTime: 300000,
  });
}
