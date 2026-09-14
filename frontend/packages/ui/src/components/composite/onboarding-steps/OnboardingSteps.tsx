/**
 * OnboardingSteps — ordered progress list (page package 24, education
 * journeys; also DS §6 backlog pair of CourseList). `<ol>` semantics with
 * `aria-current="step"` on the active step (DS-A11Y-03 order rule); status
 * labels are externalized strings.
 */
import { cn } from '../../../lib/utils';
import type { OnboardingStepsProps } from './OnboardingSteps.types';

export function OnboardingSteps({ items, tenant: _tenant, className }: OnboardingStepsProps) {
  return (
    <ol className={cn('flex flex-col gap-3', className)}>
      {items.map((step, index) => {
        const status = step.status ?? 'upcoming';
        return (
          <li
            key={step.title}
            aria-current={status === 'current' ? 'step' : undefined}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3',
              status === 'current'
                ? 'border-neutral-400 bg-neutral-50 dark:border-neutral-500 dark:bg-neutral-900'
                : 'border-neutral-200 dark:border-neutral-800',
              status === 'upcoming' && 'opacity-70',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                status === 'done' && 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100',
                status === 'current' && 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900',
                status === 'upcoming' && 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
              )}
            >
              {index + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{step.title}</span>
              {step.description && (
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{step.description}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
