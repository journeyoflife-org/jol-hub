/**
 * Donation Success Component
 * Displays thank you message and receipt download
 */

'use client';

import { useCallback } from 'react';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Separator } from '../separator';
import type { DonationSuccessProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

export function DonationSuccess({
  amount,
  currency,
  parishName,
  transactionId,
  date,
  receiptUrl,
  onClose,
  onDownloadReceipt,
}: DonationSuccessProps): JSX.Element {
  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleShare = useCallback((platform: 'facebook' | 'twitter') => {
    const text = `I just donated to ${parishName} via JOL-HUB!`;
    const url = window.location.href;
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };
    
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  }, [parishName]);

  const formattedAmount = new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Convert cents to euros

  const formattedDate = new Intl.DateTimeFormat('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <CardTitle className="text-2xl text-green-800">
          Thank You!
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Thank You Message */}
        <div className="text-center">
          <p className="text-lg text-green-700">
            Thank you for your generous donation to{' '}
            <span className="font-semibold">{parishName}</span>!
          </p>
          <p className="mt-2 text-sm text-green-600">
            Your support helps our parish continue its mission and serve the community.
          </p>
        </div>

        <Separator className="bg-green-200" />

        {/* Donation Details */}
        <div className="rounded-lg bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">Donation Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Amount:</dt>
              <dd className="font-semibold text-gray-900">{formattedAmount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Date:</dt>
              <dd className="text-gray-900">{formattedDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Transaction ID:</dt>
              <dd className="font-mono text-xs text-gray-900">{transactionId}</dd>
            </div>
          </dl>
        </div>

        {/* Tax Receipt */}
        {receiptUrl && (
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">Tax Receipt</h3>
            <p className="mb-3 text-sm text-blue-700">
              Download your official tax receipt for deduction purposes.
            </p>
            <Button
              onClick={onDownloadReceipt}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF Receipt
            </Button>
          </div>
        )}

        {/* Share Buttons */}
        <div className="space-y-2">
          <p className="text-center text-sm text-gray-600">
            Share your support:
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Share
            </Button>
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              className="flex-1 border-sky-500 text-sky-500 hover:bg-sky-50"
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Tweet
            </Button>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Return to {parishName}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

