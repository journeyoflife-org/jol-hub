import type { Metadata } from 'next';
import './globals.css';

/**
 * Root layout — consumed by all pages in this vertical.
 *
 * Invariants enforced:
 * - DS-A11Y-01: html lang attribute
 * - DS-A11Y-07: skip-navigation link
 * - Security headers via next.config.js
 */

export const metadata: Metadata = {
  title: '__VERTICAL_NAME__ | Journey of Life',
  description: '__VERTICAL_NAME__ — Journey of Life Catholic Church platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt">
      <body>
        {/* DS-A11Y-07: Skip navigation link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-white focus:p-2"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
