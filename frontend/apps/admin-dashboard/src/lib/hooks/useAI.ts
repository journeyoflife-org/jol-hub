// =============================================================================
// JOL-HUB AI Service Hooks
// TanStack Query hooks for AI content generation, SEO, lead scoring, chatbot
// List hooks normalize DRF pagination ({count, results}) into {data, total}.
// =============================================================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import type {
  GenerateContentRequest,
  GenerateSEORequest,
  ScoreLeadRequest,
  ScoreBatchRequest,
  StartChatRequest,
  ChatFeedbackRequest,
} from '@/types';

// =============================================================================
// Content Generation Hooks
// =============================================================================

export function useContentTemplates() {
  return useQuery({
    queryKey: ['ai', 'templates'],
    queryFn: async () => {
      const res = await aiApi.getTemplates();
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch templates');
      return res.data!;
    },
    staleTime: 300000,
  });
}

export function useGeneratedContent(page: number = 1, status?: string) {
  return useQuery({
    queryKey: ['ai', 'generated-content', page, status],
    queryFn: async () => {
      const res = await aiApi.getGeneratedContent(page, status);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch content');
      return { data: res.data!.results, total: res.data!.count };
    },
    staleTime: 30000,
  });
}

export function useGenerateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateContentRequest) => {
      const res = await aiApi.generateContent(data);
      if (!res.success) throw new Error(res.error?.message ?? 'Content generation failed');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'generated-content'] });
    },
  });
}

export function useApproveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await aiApi.approveContent(id, notes);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to approve');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'generated-content'] });
    },
  });
}

export function useRejectContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await aiApi.rejectContent(id, notes);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to reject');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'generated-content'] });
    },
  });
}

export function usePublishContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pageId }: { id: string; pageId?: string }) => {
      const res = await aiApi.publishContent(id, pageId);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to publish');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'generated-content'] });
    },
  });
}

// =============================================================================
// SEO Tagging Hooks
// =============================================================================

export function useSEOTagSets(page: number = 1) {
  return useQuery({
    queryKey: ['ai', 'seo-tag-sets', page],
    queryFn: async () => {
      const res = await aiApi.getSEOTagSets(page);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch SEO tags');
      return { data: res.data!.results, total: res.data!.count };
    },
    staleTime: 60000,
  });
}

export function useGenerateSEO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateSEORequest) => {
      const res = await aiApi.generateSEO(data);
      if (!res.success) throw new Error(res.error?.message ?? 'SEO generation failed');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'seo-tag-sets'] });
    },
  });
}

export function useApplySEO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await aiApi.applySEO(id);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to apply SEO tags');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'seo-tag-sets'] });
    },
  });
}

// =============================================================================
// Lead Scoring Hooks
// =============================================================================

export function useLeadScores(page: number = 1, tier?: string) {
  return useQuery({
    queryKey: ['ai', 'lead-scores', page, tier],
    queryFn: async () => {
      const res = await aiApi.getLeadScores(page, tier);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch lead scores');
      return { data: res.data!.results, total: res.data!.count };
    },
    staleTime: 60000,
  });
}

export function useScoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ScoreLeadRequest) => {
      const res = await aiApi.scoreLead(data);
      if (!res.success) throw new Error(res.error?.message ?? 'Lead scoring failed');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'lead-scores'] });
    },
  });
}

export function useScoreBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ScoreBatchRequest) => {
      const res = await aiApi.scoreBatch(data);
      if (!res.success) throw new Error(res.error?.message ?? 'Batch scoring failed');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'lead-scores'] });
    },
  });
}

export function useReviewLeadScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewOverride, reviewNotes }: { id: string; reviewOverride: number; reviewNotes: string }) => {
      const res = await aiApi.reviewLeadScore(id, reviewOverride, reviewNotes);
      if (!res.success) throw new Error(res.error?.message ?? 'Review failed');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'lead-scores'] });
    },
  });
}

// =============================================================================
// Chatbot Hooks
// =============================================================================

export function useChatSessions(page: number = 1) {
  return useQuery({
    queryKey: ['ai', 'chat-sessions', page],
    queryFn: async () => {
      const res = await aiApi.getChatSessions(page);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch chat sessions');
      return { data: res.data!.results, total: res.data!.count };
    },
    staleTime: 30000,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['ai', 'chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await aiApi.getChatMessages(sessionId);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch messages');
      return res.data!.results;
    },
    enabled: !!sessionId,
    staleTime: 5000,
  });
}

export function useStartChat() {
  return useMutation({
    mutationFn: async (data: StartChatRequest) => {
      const res = await aiApi.startChat(data);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to start chat');
      return res.data!;
    },
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionToken, message }: { sessionToken: string; message: string }) => {
      const res = await aiApi.sendChatMessage(sessionToken, { message });
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to send message');
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'chat-messages'] });
      qc.invalidateQueries({ queryKey: ['ai', 'chat-sessions'] });
    },
  });
}

export function useEndChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionToken: string) => {
      const res = await aiApi.endChat(sessionToken);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to end chat');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'chat-sessions'] });
    },
  });
}

export function useChatFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, isHelpful, note }: { messageId: string; isHelpful: boolean; note?: string }) => {
      const body: ChatFeedbackRequest = { is_helpful: isHelpful, note };
      const res = await aiApi.chatFeedback(messageId, body);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to submit feedback');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'chat-messages'] });
    },
  });
}

// =============================================================================
// AI Request Logs (admin only)
// =============================================================================

export function useAIRequestLogs(page: number = 1) {
  return useQuery({
    queryKey: ['ai', 'request-logs', page],
    queryFn: async () => {
      const res = await aiApi.getRequestLogs(page);
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch logs');
      return { data: res.data!.results, total: res.data!.count };
    },
    staleTime: 30000,
  });
}
