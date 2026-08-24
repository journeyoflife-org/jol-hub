// =============================================================================
// JOL-HUB Admin Dashboard Types
// 4-tier Federation Hierarchy with GDPR/Cannon Law Compliance
// =============================================================================

// Re-export hierarchy types
export * from './hierarchy';

// Re-export entity types
export * from './entities';

// Re-export Bitrix24 types
export * from './bitrix24';

// Re-export AI service contract types
export * from './ai';

// =============================================================================
// Common API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardStats {
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

export interface Activity {
  id: string;
  type: 'parish_approved' | 'parish_pending' | 'user_registered' | 'donation' | 'content_updated' | 'security_alert';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Donation Types
// =============================================================================

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  donor: {
    name?: string;
    email: string;
  };
  parishId: string;
  parishName: string;
  createdAt: string;
  paymentMethod: string;
  recurring: boolean;
}

export interface DonationStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  byCountry: { country: string; amount: number }[];
  byPaymentMethod: { method: string; count: number; amount: number }[];
}

// =============================================================================
// Chart Types
// =============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface CountryStats {
  code: string;
  name: string;
  parishes: number;
  users: number;
  donations: number;
  growth: number;
}

// =============================================================================
// Filter Types
// =============================================================================

export interface ParishFilters {
  status?: string;
  country?: string;
  diocese?: string;
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface UserFilters {
  status?: string;
  role?: string;
  country?: string;
  search?: string;
  mfaEnabled?: boolean;
}

// =============================================================================
// Form Types
// =============================================================================

export interface ParishApprovalForm {
  approved: boolean;
  rejectionReason?: string;
  notes?: string;
}

export interface UserCreateForm {
  name: string;
  email: string;
  role: string;
  country: string;
  parishId?: string;
  dioceseId?: string;
  sendInvite: boolean;
}

export interface UserUpdateForm {
  name?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
}
