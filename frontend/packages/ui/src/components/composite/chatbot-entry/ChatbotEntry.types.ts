import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link ChatbotEntry}. */
export interface ChatbotEntryProps {
  /**
   * ABSOLUTE LAUNCH GATE: renders nothing unless true. Default false —
   * hidden, not degraded (O-010 safety.yml absent = launch blocker).
   */
  enabled?: boolean;
  /** FAQ page route the entry points to (public FAQPage shell only). */
  faqHref: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
