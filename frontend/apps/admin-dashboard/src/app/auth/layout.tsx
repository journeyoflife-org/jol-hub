import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// =============================================================================
// Auth Layout - Route Group (no sidebar)
// GDPR Article 44: Country-specific login enforcement
// =============================================================================

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col bg-gradient-to-br">
      {/* Auth content without sidebar */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>

      {/* GDPR Footer */}
      <footer className="text-muted-foreground py-4 text-center text-xs">
        <p>
          By signing in, you agree to our{' '}
          <a href="/privacy" className="hover:text-foreground underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" className="hover:text-foreground underline">
            Terms of Service
          </a>
        </p>
        <p className="mt-1">Data processed in accordance with GDPR Article 44</p>
      </footer>
    </div>
  );
}
