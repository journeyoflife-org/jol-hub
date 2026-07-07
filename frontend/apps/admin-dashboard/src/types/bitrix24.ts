// =============================================================================
// JOL-HUB Bitrix24 Integration Types
// Real-time sync with circuit breaker pattern
// GDPR Article 44: Data residency validation on webhook receipts
// =============================================================================

export interface Bitrix24SyncStatus {
  connected: boolean;
  lastSync: string | null;
  lastSyncStatus: SyncStatus;
  pendingItems: number;
  failedItems: number;
  successCount: number;
  failureCount: number;
  circuitBreakerState: CircuitBreakerState;
  recentActivity?: Array<{ success: boolean; message: string; timestamp: string }>;
}

export type SyncStatus = 
  | 'idle'
  | 'syncing'
  | 'completed'
  | 'failed'
  | 'partial';

// Circuit Breaker Pattern for fault tolerance
export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: string | null;
  nextRetryTime: string | null;
  lastFailure?: string;
  resetTimeout?: number;
}

export interface Bitrix24SyncJob {
  id: string;
  entityType: SyncableEntity;
  entityId: string;
  direction: 'to_bitrix' | 'from_bitrix';
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  error?: SyncError;
  conflicts?: SyncConflict[];
}

export type SyncableEntity = 
  | 'parish'
  | 'user'
  | 'donation'
  | 'contact'
  | 'deal';

export interface SyncError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface SyncConflict {
  id: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  resolution?: 'local' | 'remote' | 'manual';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface FieldMapping {
  id: string;
  entityType: string;
  localField: string;
  remoteField: string;
  bitrixField?: string; // alias for remoteField
  syncDirection: 'bidirectional' | 'local-to-remote' | 'remote-to-local';
  transform: 'none' | 'date' | 'currency' | 'country_code' | null;
  required?: boolean;
  enabled: boolean;
}

// Webhook payload from Bitrix24
export interface Bitrix24WebhookPayload {
  event: string;
  data: {
    FIELDS: {
      ID: string;
      [key: string]: string;
    };
  };
  ts: string;
  auth: {
    domain: string;
    member_id: string;
  };
}

export interface Bitrix24Health {
  apiReachable: boolean;
  authValid: boolean;
  rateLimitRemaining: number;
  rateLimitReset: string;
  lastError?: string;
}

// Bitrix24 Conflict Type for conflict resolution
export interface Bitrix24Conflict {
  id: string;
  entityType: string;
  entityName: string;
  field: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  detectedAt: string;
}
