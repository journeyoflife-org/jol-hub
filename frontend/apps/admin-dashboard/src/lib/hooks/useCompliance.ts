// =============================================================================
// JOL-HUB Compliance Hooks
// TanStack Query hooks for GDPR compliance data
// =============================================================================

'use client';

import { useQuery } from '@tanstack/react-query';

// Types for compliance data
interface GDPRStats {
  dataSubjects: number;
  activeConsents: number;
  pendingConsents: number;
  withdrawnConsents: number;
  pendingRequests: number;
}

interface ComplianceAuditLog {
  id: string;
  type: 'consent' | 'deletion' | 'export' | 'access';
  action: string;
  user: string;
  timestamp: string;
  country: string;
}

// API fetch functions
async function fetchGDPRStats(): Promise<GDPRStats> {
  const response = await fetch('/api/compliance/gdpr/stats');
  if (!response.ok) throw new Error('Failed to fetch GDPR stats');
  return response.json();
}

async function fetchComplianceAudit(): Promise<ComplianceAuditLog[]> {
  const response = await fetch('/api/compliance/audit');
  if (!response.ok) throw new Error('Failed to fetch compliance audit');
  return response.json();
}

// Hook for GDPR statistics
export function useGDPRStats() {
  return useQuery({
    queryKey: ['compliance', 'gdpr', 'stats'],
    queryFn: fetchGDPRStats,
    staleTime: 60000,
  });
}

// Hook for compliance audit logs
export function useComplianceAudit() {
  return useQuery({
    queryKey: ['compliance', 'audit'],
    queryFn: fetchComplianceAudit,
    staleTime: 30000,
  });
}
