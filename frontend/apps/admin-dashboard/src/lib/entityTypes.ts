// =============================================================================
// JOL-HUB Entity Type Definitions and Validation Schemas
// 7 entity types with Zod validation for forms
// Canon Law CIC 1300-1307: Catholic entity validation rules
// =============================================================================

import { z } from 'zod';
import type { EntityCategory, EntityStatus } from '@/types';

// Define EntityType locally as string union for flexibility
export type EntityType = 'parish' | 'diocese' | 'country' | 'user' | 'donation' | 'content' | 'analytics';

export interface EntityTypeConfig {
  id: string;
  name: string;
  icon: string;
}

export const ENTITY_TYPES: EntityTypeConfig[] = [
  { id: 'parish', name: 'Parish', icon: '⛪' },
  { id: 'diocese', name: 'Diocese', icon: '🏛️' },
  { id: 'country', name: 'Country', icon: '🏳️' },
  { id: 'user', name: 'User', icon: '👤' },
  { id: 'donation', name: 'Donation', icon: '💰' },
  { id: 'content', name: 'Content', icon: '📝' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
];

export const ENTITY_STATUSES: EntityStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'suspended',
  'archived',
];

export const ENTITY_CATEGORIES: EntityCategory[] = ['catholic', 'commercial'];

export const STATUS_COLORS: Record<EntityStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export const STATUS_LABELS: Record<EntityStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  archived: 'Archived',
};

// =============================================================================
// Zod Schemas for Form Validation
// =============================================================================

// Parish form schema - Canon Law CIC 1300-1307 validation
export const parishFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  countryCode: z.string().length(2, 'Invalid country code'),
  dioceseId: z.string().min(1, 'Diocese is required'),
  contact: z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().min(6, 'Invalid phone number'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
  }),
  canonical: z.object({
    patronSaint: z.string().optional(),
    consecrationDate: z.string().optional(),
  }),
});

// Commercial entity form schema - VAT/License validation
export const commercialEntitySchema = z.object({
  type: z.enum(['religious_order', 'pilgrimage_operator', 'religious_goods', 'catholic_media']),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  vatNumber: z.string().min(5, 'VAT number is required'),
  licenseNumber: z.string().optional(),
  contact: z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().min(6, 'Invalid phone number'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    countryCode: z.string().length(2, 'Country is required'),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  }),
});

// User form schema
export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'super_admin',
    'country_admin',
    'diocese_admin',
    'parish_admin',
    'parish_editor',
    'support',
    'auditor',
  ]),
  countryCode: z.string().optional(),
  dioceseId: z.string().optional(),
  parishId: z.string().optional(),
  sendInvite: z.boolean().default(true),
});

export type ParishFormData = z.infer<typeof parishFormSchema>;
export type CommercialEntityFormData = z.infer<typeof commercialEntitySchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
