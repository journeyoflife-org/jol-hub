'use client'

/**
 * LoadingSpinner — accessible loading indicator.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: ClassValue
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading…',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={twMerge('flex items-center justify-center', className)}
    >
      <div
        className={clsx(
          'animate-spin rounded-full border-gray-300 border-t-blue-600',
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
