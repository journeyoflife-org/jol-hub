/**
 * CRM components barrel — STEP 9.
 *
 * Bitrix24-backed CRM UI for the template renderer. All data flows through
 * the same-origin `/api/crm/*` proxies → hub backend → jol-bitrix24-
 * integration; the browser NEVER talks to Bitrix24 directly and never sees
 * tokens (SOC 2 CC6.1, STEP 9 rules).
 */
export { ContactFormCrm } from './ContactFormCrm';
export type { ContactFormCrmProps } from './ContactFormCrm';
export { LeadTracker } from './LeadTracker';
export type { LeadTrackerProps } from './LeadTracker';
export { PipelineFunnel } from './PipelineFunnel';
export type { PipelineFunnelProps } from './PipelineFunnel';
export { ClickToCall } from './ClickToCall';
export type { ClickToCallProps } from './ClickToCall';
