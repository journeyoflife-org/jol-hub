import type { TenantTheme } from '../../../lib/tenant-theme';

/** One step of an {@link OnboardingSteps} sequence. */
export interface OnboardingStep {
  /** Step title. */
  title: string;
  /** Step description/excerpt. */
  description?: string;
  /** Step state — drives aria-current and visual treatment. */
  status?: 'done' | 'current' | 'upcoming';
}

/** Props for {@link OnboardingSteps}. */
export interface OnboardingStepsProps {
  /** Steps in order; index+1 is the displayed number. */
  items: OnboardingStep[];
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
