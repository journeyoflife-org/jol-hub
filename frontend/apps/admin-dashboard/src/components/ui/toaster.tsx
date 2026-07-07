'use client';

import { cn } from '@/lib/utils';

interface ToasterProps {
  className?: string;
}

export function Toaster({ className }: ToasterProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2',
        className
      )}
      id="toaster"
    />
  );
}
