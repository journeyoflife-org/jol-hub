// =============================================================================
// JOL-HUB Admin Dashboard — AI Service Types
// Contract for the jol-hub AI layer (content-generation, seo-tagging,
// lead-scoring, chatbot). Reconstructed from client usage in src/lib/api.ts
// and src/lib/hooks/useAI.ts (F1 remediation, P0 baseline audit 2026-08-24).
// Field names follow DRF snake_case serialization; backend endpoints under
// apps/ai are pending implementation — treat this file as the contract.
// =============================================================================

// -----------------------------------------------------------------------------
// DRF pagination envelope ({count, results}) — distinct from PaginatedResponse
// -----------------------------------------------------------------------------

export interface DRFPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// -----------------------------------------------------------------------------
// Content generation
// -----------------------------------------------------------------------------

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  template_text?: string;
  variables?: string[];
  created_at: string;
}

export type GeneratedContentStatus = 'pending' | 'approved' | 'rejected' | 'published';

export interface GeneratedContent {
  id: string;
  template?: string;
  title?: string;
  content?: string;
  status: GeneratedContentStatus;
  review_notes?: string;
  page_id?: string;
  page_slug?: string;
  created_at: string;
  updated_at?: string;
}

export interface GenerateContentRequest {
  template_id: string;
  context?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// SEO tagging
// -----------------------------------------------------------------------------

export interface SEOTagSet {
  id: string;
  page_id?: string;
  url?: string;
  title?: string;
  meta_description?: string;
  keywords?: string[];
  applied?: boolean;
  created_at: string;
}

export interface GenerateSEORequest {
  page_id: string;
  url?: string;
}

// -----------------------------------------------------------------------------
// Lead scoring
// -----------------------------------------------------------------------------

export interface LeadScore {
  id: string;
  lead_id?: string;
  organization?: string;
  score?: number;
  tier?: string;
  factors?: Record<string, unknown>;
  review_override?: number;
  review_notes?: string;
  created_at: string;
}

export interface ScoreLeadRequest {
  lead_id: string;
  context?: Record<string, unknown>;
}

export interface ScoreBatchRequest {
  organization: string;
  limit?: number;
}

// -----------------------------------------------------------------------------
// Chatbot
// -----------------------------------------------------------------------------

export interface ChatSession {
  id: string;
  session_token?: string;
  status?: 'active' | 'ended';
  started_at: string;
  ended_at?: string | null;
}

export interface ChatMessage {
  id: string;
  session?: string;
  role: 'user' | 'assistant';
  content: string;
  is_helpful?: boolean | null;
  feedback_note?: string;
  created_at: string;
}

export interface StartChatRequest {
  context?: Record<string, unknown>;
}

export interface SendChatMessageRequest {
  message: string;
}

export interface ChatFeedbackRequest {
  is_helpful: boolean;
  note?: string;
}

// -----------------------------------------------------------------------------
// AI request logs (admin only)
// -----------------------------------------------------------------------------

export interface AIRequestLog {
  id: string;
  service?: string;
  endpoint?: string;
  status?: string;
  duration_ms?: number;
  created_at: string;
}
