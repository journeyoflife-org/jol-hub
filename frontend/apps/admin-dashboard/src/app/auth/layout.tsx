import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// =============================================================================
// Auth Layout - Route Group (no sidebar)
// GDPR Article 44: Country-specific login enforcement
// =============================================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      {/* Auth content without sidebar */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          {children}
        </Suspense>
      </main>
      
      {/* GDPR Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>
          By signing in, you agree to our{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>
        </p>
        <p className="mt-1">
          Data processed in accordance with GDPR Article 44
        </p>
      </footer>
    </div>
  );
}
