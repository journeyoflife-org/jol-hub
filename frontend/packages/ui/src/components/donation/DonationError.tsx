/**
 * Donation Error Component
 * Displays user-friendly error messages with retry options
 */

'use client';

import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Alert, AlertDescription, AlertTitle } from '../alert';
import type { DonationErrorProps, DonationError } from './types';

// =============================================================================
// ERROR CONFIGURATION
// =============================================================================

interface ErrorConfig {
  title: string;
  description: string;
  icon: JSX.Element;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DonationErrorComponent({
  error,
  onRetry,
  onContactSupport,
}: DonationErrorProps): JSX.Element {
  // ---------------------------------------------------------------------------
  // ERROR CONFIGURATION
  // ---------------------------------------------------------------------------

  const getErrorConfig = (error: DonationError): ErrorConfig => {
    const configs: Record<DonationError['type'], ErrorConfig> = {
      card: {
        title: 'Payment Declined',
        description: error.message || 'Your card was declined. Please try a different payment method or contact your bank.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
        action: onRetry ? {
          label: 'Try Again',
          onClick: onRetry,
        } : undefined,
      },
      network: {
        title: 'Connection Error',
        description: error.message || 'Unable to connect to the payment server. Please check your internet connection and try again.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        action: error.retryable && onRetry ? {
          label: 'Retry',
          onClick: onRetry,
        } : undefined,
      },
      authentication: {
        title: 'Authentication Failed',
        description: error.message || '3D Secure authentication failed. Please contact your bank or try a different card.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        action: onContactSupport ? {
          label: 'Contact Support',
          onClick: onContactSupport,
        } : undefined,
      },
      validation: {
        title: 'Invalid Information',
        description: error.message || 'Please check your information and try again.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        action: onRetry ? {
          label: 'Fix and Retry',
          onClick: onRetry,
        } : undefined,
      },
      server: {
        title: 'Server Error',
        description: error.message || 'Something went wrong on our end. Please try again in a few moments.',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ),
        action: error.retryable && onRetry ? {
          label: 'Try Again',
          onClick: onRetry,
        } : undefined,
      },
    };

    return configs[error.type] || configs.server;
  };

  const config = getErrorConfig(error);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            {config.icon}
          </div>
          <CardTitle className="text-lg text-red-800">{config.title}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="bg-red-50">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{config.description}</AlertDescription>
        </Alert>

        {/* Error Code (for support) */}
        {error.code && (
          <div className="rounded bg-gray-100 p-2 text-center">
            <p className="text-xs text-gray-500">
              Error Code: <span className="font-mono">{error.code}</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {config.action && (
            <Button
              onClick={config.action.onClick}
              className="w-full"
              style={{ backgroundColor: '#00843D' }}
            >
              {config.action.label}
            </Button>
          )}
          
          {!config.action && onContactSupport && (
            <Button
              onClick={onContactSupport}
              variant="outline"
              className="w-full"
            >
              <svg 
                className="mr-2 h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              Contact Support
            </Button>
          )}

          {/* Alternative Payment Methods */}
          {error.type === 'card' && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Alternative Payment Methods:
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Try a different credit/debit card</li>
                <li>• Use bank transfer (SEPA)</li>
                <li>• Contact the parish office for other options</li>
              </ul>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500">
          If you continue to experience issues, please contact us at{' '}
          <a 
            href="mailto:support@jol-hub.eu" 
            className="text-primary hover:underline"
          >
            support@jol-hub.eu
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

