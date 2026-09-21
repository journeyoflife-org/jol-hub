/**
 * Governance metadata for tenant fixtures (Wave 0 / schema v2).
 *
 * Every tenant fixture MUST carry governance metadata proving its
 * content was verified by a responsible party. Expired governance
 * emits a build warning but does not fail the build (the
 * approvalStatus gate is the hard stop).
 */
import { z } from 'zod';

export const ApprovalStatusSchema = z.enum([
  'draft',
  'pending-review',
  'approved',
  'expired',
  'revoked',
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const GovernanceSchema = z
  .object({
    /** URL of the source document (parish website, diocese registry, etc.). */
    sourceUrl: z.string().url(),
    /** ISO 8601 date when the content was last verified. */
    verifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Email or ID of the person who verified the content. */
    verifier: z.string().optional(),
    /** Editorial approval status. */
    approvalStatus: ApprovalStatusSchema,
    /** Next scheduled review date (ISO 8601). */
    nextReviewDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine(
    (data) => {
      // Warn if nextReviewDate is in the past (non-blocking).
      if (data.nextReviewDate) {
        const review = new Date(data.nextReviewDate);
        if (review < new Date()) {
          console.warn(
            `[seed-data] WARNING: governance nextReviewDate ${data.nextReviewDate} is in the past`
          );
        }
      }
      return true;
    },
    { message: 'Expired review date (warning only)' }
  );

export type Governance = z.infer<typeof GovernanceSchema>;

/**
 * Minimal iCalendar RRULE validator (RFC 5545 §3.3.10).
 * Accepts the common subset used for mass schedules:
 *   FREQ=DAILY|WEEKLY|MONTHLY|YEARLY [;BYDAY=...] [;COUNT=N] [;UNTIL=date]
 * Does NOT attempt full RFC compliance — just format sanity.
 */
const RRULE_PATTERN = /^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[^;]+)*$/;

export function isValidRRule(value: string): boolean {
  return RRULE_PATTERN.test(value);
}
