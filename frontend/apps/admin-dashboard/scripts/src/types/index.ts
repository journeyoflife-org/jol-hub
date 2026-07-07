// Auto-generated type definitions
export interface Entity {
  id: string;
  name: string;
  entityType: EntityType;
  country: string;
  canonicalStatus?: CanonicalStatus;
  bitrix24Id?: string;
  bitrix24Status: SyncState;
  gdprStatus: 'compliant' | 'review_needed';
  dioceseId?: string;
  createdAt: string;
  updatedAt: string;
}

export type EntityType =
  | 'basilica'
  | 'cathedral'
  | 'diocese'
  | 'parish'
  | 'protestant'
  | 'orthodox'
  | 'funeral_home'
  | 'cemetery_service';

export type CanonicalStatus = 'pending' | 'verification_pending' | 'granted' | 'rejected';
export type SyncState = 'synced' | 'syncing' | 'error' | 'pending';

export interface HierarchyContext {
  tier: 'super' | 'country' | 'diocese' | 'facility';
  country: string | null;
  scopeId: string | null;
  dataResidency: string;
}

export interface Bitrix24WebhookPayload {
  entityId: string;
  entityType: string;
  country: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  languages: string[];
}
