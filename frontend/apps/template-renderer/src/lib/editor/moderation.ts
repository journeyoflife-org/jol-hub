/**
 * Moderation domain types — STEP 14.
 *
 * Every tenant change (page edit, media upload) enters the moderation
 * pipeline: AI advisory screening (on-prem Ollama/RAG via the hub backend —
 * the frontend NEVER calls the LLM directly) + human decision. Nothing
 * auto-approves; every decision is audit-logged (SOC 2 CC7.2).
 *
 * GDPR Art. 9: uploads that may contain special-category data (religious
 * ceremonies with identifiable people) route to the dedicated legal review
 * queue (`art9-review`).
 */

/** Lifecycle of a moderation item. */
export type ModerationStatus =
  | 'pending'        // awaiting human decision (AI screening done or running)
  | 'scanning'       // malware scan / AI moderation in progress
  | 'approved'
  | 'rejected'
  | 'changes-requested'
  | 'escalated'      // sent to JOL platform admins
  | 'art9-review';   // GDPR Art. 9 legal review queue

export type ModerationItemType = 'page-edit' | 'media-upload';

/** AI moderation flag categories (Ollama/RAG response contract). */
export type AiFlagCategory =
  | 'nudity'
  | 'violence'
  | 'hate-speech'
  | 'sectarian-content'
  | 'inappropriate-religious-imagery'
  | 'copyright-violation'
  | 'personal-data'
  | 'art9-sensitive-content';

export type AiFlagSeverity = 'low' | 'medium' | 'high';

export interface AiFlag {
  category: AiFlagCategory;
  severity: AiFlagSeverity;
  reasoning: string;
}

/** Ollama/RAG moderation response (backend-relayed). */
export interface AiModerationResult {
  /** AI recommendation — ADVISORY ONLY; the human makes the final call. */
  approved: boolean;
  flags: AiFlag[];
  /** Model/pipeline identification for auditability. */
  model?: string;
  completedAt?: string;
}

/** One item in the moderation queue. */
export interface ModerationItem {
  id: string;
  tenantSlug: string;
  type: ModerationItemType;
  status: ModerationStatus;
  /** Author identity for the audit trail (never rendered publicly). */
  submittedBy?: string;
  submittedAt: string;
  /** page-edit: the page being changed. */
  pageId?: string;
  pagePath?: string;
  /** media-upload: quarantine reference. */
  mediaId?: string;
  fileName?: string;
  /** Diff payload (page edits) — before/after block JSON. */
  before?: unknown;
  after?: unknown;
  ai?: AiModerationResult;
  /** Malware scan state (ClamAV-class, backend-owned). */
  scan?: { clean: boolean | null; engine?: string; scannedAt?: string };
}

/** Human decision recorded against an item (audit log entry). */
export interface ModerationDecision {
  itemId: string;
  action: 'approve' | 'reject' | 'request-changes' | 'escalate';
  /** Required for reject / request-changes. */
  reason?: string;
  decidedBy: string;
  decidedAt: string;
}

/** Media upload pipeline state (MediaUploader surface). */
export type MediaUploadState =
  | 'idle'
  | 'validating'   // client-side type/size/dimensions/alt
  | 'uploading'    // transfer in progress
  | 'quarantined'  // stored, awaiting scan + moderation approval
  | 'approved'
  | 'rejected';

/** One tenant media library entry. */
export interface MediaLibraryItem {
  id: string;
  tenantSlug: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  state: MediaUploadState;
  uploadedAt: string;
  thumbnailUrl?: string;
}

/** Human decision reasons are mandatory for negative outcomes. */
export function decisionRequiresReason(action: ModerationDecision['action']): boolean {
  return action === 'reject' || action === 'request-changes';
}

/** Items that belong to the GDPR Art. 9 legal review queue. */
export function isArt9Item(item: ModerationItem): boolean {
  return (
    item.status === 'art9-review' ||
    (item.ai?.flags ?? []).some((flag) => flag.category === 'art9-sensitive-content')
  );
}
