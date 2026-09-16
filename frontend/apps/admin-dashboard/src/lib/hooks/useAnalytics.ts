// =============================================================================
// JOL-HUB Analytics Hooks
// TanStack Query hooks for analytics data fetching
// GDPR Article 44: Aggregated data only
// =============================================================================

'use client';

import { useQuery } from '@tanstack/react-query';

// Types for analytics data
interface AnalyticsOverview {
  parishes: Array<{ date: string; count: number }>;
  users: Array<{ date: string; count: number }>;
  donations: Array<{ date: string; amount: number }>;
  activeUsers: number;
  userGrowth: number;
  totalDonations: number;
  donationGrowth: number;
  activeCountries: number;
}

interface EntityAnalytics {
  byType: Array<{ type: string; count: number }>;
  byCountry: Array<{ country: string; parishCount: number; userCount: number }>;
}

interface DonationAnalytics {
  byCountry: Array<{ country: string; totalAmount: number; transactionCount: number }>;
}

// API fetch functions
async function fetchAnalyticsOverview(timeRange: string): Promise<AnalyticsOverview> {
  const response = await fetch(`/api/analytics/overview?timeRange=${timeRange}`);
  if (!response.ok) throw new Error('Failed to fetch analytics overview');
  return response.json();
}

async function fetchEntityAnalytics(
  timeRange: string,
  country?: string
): Promise<EntityAnalytics> {
  const params = new URLSearchParams({ timeRange });
  if (country) params.set('country', country);
  
  const response = await fetch(`/api/analytics/entities?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch entity analytics');
  return response.json();
}

async function fetchDonationAnalytics(
  timeRange: string,
  country?: string
): Promise<DonationAnalytics> {
  const params = new URLSearchParams({ timeRange });
  if (country) params.set('country', country);
  
  const response = await fetch(`/api/analytics/donations?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch donation analytics');
  return response.json();
}

// Hook for analytics overview
export function useAnalyticsOverview(timeRange: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', timeRange],
    queryFn: () => fetchAnalyticsOverview(timeRange),
    staleTime: 60000,
  });
}

// Hook for entity analytics
export function useEntityAnalytics(timeRange: string, country?: string) {
  return useQuery({
    queryKey: ['analytics', 'entities', timeRange, country],
    queryFn: () => fetchEntityAnalytics(timeRange, country),
    staleTime: 60000,
  });
}

// Hook for donation analytics
export function useDonationAnalytics(timeRange: string, country?: string) {
  return useQuery({
    queryKey: ['analytics', 'donations', timeRange, country],
    queryFn: () => fetchDonationAnalytics(timeRange, country),
    staleTime: 60000,
  });
}
