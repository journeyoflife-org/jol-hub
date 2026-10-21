import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = localFont({
  src: '../../packages/ui/fonts/Inter.var.woff2',
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? 'JOL-HUB'}`,
    default: process.env.NEXT_PUBLIC_APP_NAME ?? 'JOL-HUB',
  },
  description: 'Journey Of Life — digital platform for religious institutions across the EU',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
