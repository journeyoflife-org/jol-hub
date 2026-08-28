// =============================================================================
// JOL-HUB Admin Dashboard Hooks
// Central export for all custom hooks
// =============================================================================

// Re-export from main hooks directory
export {
  useCountry,
  useHierarchy,
  useGDPR,
  useBitrix24,
  useBitrix24Realtime,
} from '@/hooks';

// Dashboard hooks
export { useDashboardStats, useRecentActivity, useCountryStats } from './useDashboard';

// Entity hooks
export { useEntities, useEntity, useApproveEntity, useVerifyEntity } from './useEntities';

// Analytics hooks
export {
  useAnalyticsOverview,
  useEntityAnalytics,
  useDonationAnalytics,
} from './useAnalytics';

// Compliance hooks
export { useGDPRStats, useComplianceAudit } from './useCompliance';

// User hooks
export { useUsers, useRoles } from './useUsers';

// AI hooks
export {
  useContentTemplates,
  useGeneratedContent,
  useGenerateContent,
  useApproveContent,
  useRejectContent,
  usePublishContent,
  useSEOTagSets,
  useGenerateSEO,
  useApplySEO,
  useLeadScores,
  useScoreLead,
  useScoreBatch,
  useReviewLeadScore,
  useChatSessions,
  useChatMessages,
  useStartChat,
  useSendChatMessage,
  useEndChat,
  useChatFeedback,
  useAIRequestLogs,
} from './useAI';
