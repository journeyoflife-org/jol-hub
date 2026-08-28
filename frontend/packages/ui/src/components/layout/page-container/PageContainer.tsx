/**
 * PageContainer — consistent horizontal measure + spacing for page content.
 */
import { cn } from '../../../lib/utils';
import type { PageContainerProps } from './PageContainer.types';

export function PageContainer({ children, narrow = false, className }: PageContainerProps) {
  return (
    <div className={cn('container mx-auto px-4 py-8', narrow && 'max-w-3xl', className)}>
      {children}
    </div>
  );
}
