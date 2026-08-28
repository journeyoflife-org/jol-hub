// =============================================================================
// JOL-HUB Admin Dashboard API Client
// =============================================================================

import type {
  Parish,
  EntityListResponse,
  ParishFilters,
  User,
  UserFilters,
  DashboardStats,
  DonationStats,
  Activity,
  ApiResponse,
  DRFPaginatedResponse,
  ContentTemplate,
  GeneratedContent,
  AIRequestLog,
  LeadScore,
  ChatSession,
  ChatMessage,
  SEOTagSet,
  GenerateContentRequest,
  GenerateSEORequest,
  ScoreLeadRequest,
  ScoreBatchRequest,
  StartChatRequest,
  SendChatMessageRequest,
  ChatFeedbackRequest,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Store for the current access token
let accessToken: string | null = null;

/**
 * Set the access token for API requests
 */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Generic fetch wrapper with error handling and auth
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      // Clear token and redirect to login
      accessToken = null;
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login?error=SessionExpired';
      }
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please login again.',
        },
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.message || errorData.detail || response.statusText,
        },
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {
        success: true,
        data: undefined as T,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[API] Network error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      },
    };
  }
}

// =============================================================================
// Dashboard API
// =============================================================================

export const dashboardApi = {
  getStats: () => 
    fetchApi<DashboardStats>('/admin/dashboard/stats'),
  
  getRecentActivity: (limit: number = 10) => 
    fetchApi<Activity[]>(`/admin/dashboard/activity?limit=${limit}`),
  
  getCountryStats: () => 
    fetchApi<{ code: string; name: string; parishes: number; users: number; growth: number }[]>('/admin/dashboard/countries'),
  
  getSystemHealth: () =>
    fetchApi<{
      status: 'operational' | 'degraded' | 'down';
      services: { name: string; status: string; latency: number }[];
    }>('/admin/dashboard/health'),
};

// =============================================================================
// Parishes API
// =============================================================================

export const parishesApi = {
  list: (filters: ParishFilters = {}, page: number = 1, pageSize: number = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    return fetchApi<EntityListResponse<Parish>>(`/admin/parishes?${params}`);
  },
  
  get: (id: string) => 
    fetchApi<Parish>(`/admin/parishes/${id}`),
  
  approve: (id: string, notes?: string) => 
    fetchApi<Parish>(`/admin/parishes/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  
  reject: (id: string, reason: string) => 
    fetchApi<Parish>(`/admin/parishes/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  suspend: (id: string, reason: string) => 
    fetchApi<Parish>(`/admin/parishes/${id}/suspend/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  update: (id: string, data: Partial<Parish>) => 
    fetchApi<Parish>(`/admin/parishes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    fetchApi<void>(`/admin/parishes/${id}/`, {
      method: 'DELETE',
    }),

  getStats: () =>
    fetchApi<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      thisMonth: number;
    }>('/admin/parishes/stats/'),
};

// =============================================================================
// Users API
// =============================================================================

export const usersApi = {
  list: (filters: UserFilters = {}, page: number = 1, pageSize: number = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    return fetchApi<EntityListResponse<User>>(`/admin/users?${params}`);
  },
  
  get: (id: string) => 
    fetchApi<User>(`/admin/users/${id}/`),
  
  create: (data: {
    name: string;
    email: string;
    role: string;
    country: string;
    sendInvite?: boolean;
  }) => 
    fetchApi<User>('/admin/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<User>) => 
    fetchApi<User>(`/admin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    fetchApi<void>(`/admin/users/${id}/`, {
      method: 'DELETE',
    }),
  
  resetPassword: (id: string) => 
    fetchApi<void>(`/admin/users/${id}/reset-password/`, {
      method: 'POST',
    }),
  
  toggleMfa: (id: string, enabled: boolean) => 
    fetchApi<User>(`/admin/users/${id}/mfa/`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  getStats: () =>
    fetchApi<{
      total: number;
      active: number;
      admins: number;
      mfaEnabled: number;
      mfaPercentage: number;
    }>('/admin/users/stats/'),
};

// =============================================================================
// Donations API
// =============================================================================

export const donationsApi = {
  getStats: () => 
    fetchApi<DonationStats>('/admin/donations/stats/'),
  
  list: (filters: {
    parishId?: string;
    country?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}, page: number = 1, pageSize: number = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return fetchApi<{ data: unknown[]; total: number }>(`/admin/donations?${params}`);
  },
};

// =============================================================================
// Analytics API
// =============================================================================

export const analyticsApi = {
  getOverview: (period: '7d' | '30d' | '90d' | '1y' = '30d') =>
    fetchApi<{
      parishes: { date: string; count: number }[];
      users: { date: string; count: number }[];
      donations: { date: string; amount: number }[];
      pageViews: { date: string; count: number }[];
    }>(`/admin/analytics/overview/?period=${period}`),
  
  /**
   * Get top parishes with k-anonymity protection.
   * GDPR Art. 5(1)(f) - Small parishes (< k=5) are anonymized.
   * 
   * @param metric - Sort metric: 'visitors' | 'donations' | 'engagement'
   * @param limit - Maximum results (default: 10)
   * @returns Array of parish data with is_anonymized flag
   */
  getTopParishes: (metric: 'visitors' | 'donations' | 'engagement', limit: number = 10) =>
    fetchApi<TopParishResult[]>(`/admin/analytics/top-parishes/?metric=${metric}&limit=${limit}`),
  
  getCountryBreakdown: () =>
    fetchApi<{ country: string; parishes: number; users: number; donations: number }[]>('/admin/analytics/countries/'),
  
  exportReport: (type: 'pdf' | 'csv' | 'excel', filters: Record<string, unknown>) =>
    fetchApi<{ downloadUrl: string }>('/admin/analytics/export/', {
      method: 'POST',
      body: JSON.stringify({ type, filters }),
    }),
};

/**
 * Top parish result with k-anonymity protection.
 * GDPR Art. 5(1)(f) - Small parishes are aggregated into "Other Parishes".
 */
interface TopParishResult {
  id: string;
  name: string;
  country: string;
  visitors: number;
  donations: number;
  /**
   * True if this parish has been anonymized or is the "Other" bucket.
   * Do not display individual parish details when true.
   */
  is_anonymized: boolean;
}

// =============================================================================
// AI Services API
// Content generation, SEO tagging, lead scoring, chatbot
// =============================================================================

export const aiApi = {
  // Content Generation
  getTemplates: () =>
    fetchApi<ContentTemplate[]>('/ai/content/templates/'),

  generateContent: (data: GenerateContentRequest) =>
    fetchApi<GeneratedContent>('/ai/content/generate/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGeneratedContent: (page: number = 1, status?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (status) params.append('status', status);
    return fetchApi<DRFPaginatedResponse<GeneratedContent>>(`/ai/content/generated/?${params}`);
  },

  approveContent: (id: string, notes?: string) =>
    fetchApi<GeneratedContent>(`/ai/content/generated/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  rejectContent: (id: string, notes: string) =>
    fetchApi<GeneratedContent>(`/ai/content/generated/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  publishContent: (id: string, pageId?: string) =>
    fetchApi<{ message: string; page_id: string; page_slug: string }>(
      `/ai/content/generated/${id}/publish/`,
      {
        method: 'POST',
        body: JSON.stringify({ page_id: pageId }),
      }
    ),

  // SEO Tagging
  generateSEO: (data: GenerateSEORequest) =>
    fetchApi<SEOTagSet>('/ai/seo/generate/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSEOTagSets: (page: number = 1) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    return fetchApi<DRFPaginatedResponse<SEOTagSet>>(`/ai/seo/?${params}`);
  },

  applySEO: (id: string) =>
    fetchApi<SEOTagSet>(`/ai/seo/${id}/apply/`, {
      method: 'POST',
    }),

  // Lead Scoring
  scoreLead: (data: ScoreLeadRequest) =>
    fetchApi<LeadScore>('/ai/leads/score/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  scoreBatch: (data: ScoreBatchRequest) =>
    fetchApi<{ message: string; task_id: string; organization: string; limit: number }>(
      '/ai/leads/score-batch/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getLeadScores: (page: number = 1, tier?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (tier) params.append('tier', tier);
    return fetchApi<DRFPaginatedResponse<LeadScore>>(`/ai/leads/scores/?${params}`);
  },

  reviewLeadScore: (id: string, reviewOverride: number, reviewNotes: string) =>
    fetchApi<LeadScore>(`/ai/leads/scores/${id}/review/`, {
      method: 'PATCH',
      body: JSON.stringify({ review_override: reviewOverride, review_notes: reviewNotes }),
    }),

  // Chatbot
  startChat: (data: StartChatRequest) =>
    fetchApi<ChatSession>('/ai/chat/start/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendChatMessage: (sessionToken: string, data: SendChatMessageRequest) =>
    fetchApi<ChatMessage>(`/ai/chat/${sessionToken}/send/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  endChat: (sessionToken: string) =>
    fetchApi<{ message: string }>(`/ai/chat/${sessionToken}/end/`, {
      method: 'POST',
    }),

  chatFeedback: (messageId: string, data: ChatFeedbackRequest) =>
    fetchApi<{ message: string }>(`/ai/chat/messages/${messageId}/feedback/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getChatSessions: (page: number = 1) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    return fetchApi<DRFPaginatedResponse<ChatSession>>(`/ai/chat/sessions/?${params}`);
  },

  getChatMessages: (sessionId: string) =>
    fetchApi<DRFPaginatedResponse<ChatMessage>>(`/ai/chat/sessions/${sessionId}/messages/`),

  // AI Request Logs (admin only)
  getRequestLogs: (page: number = 1) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    return fetchApi<DRFPaginatedResponse<AIRequestLog>>(`/ai/logs/?${params}`);
  },
};

// =============================================================================
// Auth API (for token management)
// =============================================================================

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.detail || 'Login failed');
    }
    
    return response.json();
  },

  refresh: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    return response.json();
  },

  logout: async () => {
    if (!accessToken) return;
    
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  },
};
