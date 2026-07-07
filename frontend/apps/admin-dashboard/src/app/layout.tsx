import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'JOL-HUB Admin Dashboard',
    template: '%s | JOL-HUB Admin',
  },
  description: 'Administrative dashboard for Journey Of Life platform - managing 400,000 parish websites across 27 EU countries',
  keywords: ['admin', 'dashboard', 'parish', 'catholic', 'church', 'management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
