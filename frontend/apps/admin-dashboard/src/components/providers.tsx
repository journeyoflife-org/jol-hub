'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { setAccessToken } from '@/lib/api';

/**
 * Component to sync the access token from session to API client
 */
function TokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (token) {
      setAccessToken(token);
    } else {
      setAccessToken(null);
    }
  }, [session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 401 errors
              if (error instanceof Error && error.message.includes('Session expired')) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <SessionProvider>
      <TokenSync />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
