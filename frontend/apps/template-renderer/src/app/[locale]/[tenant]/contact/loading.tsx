/**
 * Contact loading skeleton — STEP 6.
 *
 * Shown during streaming / client navigation to `/contact`. `/contact` never
 * calls `notFound()` for a known tenant, so a loading boundary here is safe.
 * See `about/loading.tsx` for why the tenant-level loading.tsx is omitted.
 */
import { Skeleton } from '@jol-hub/ui/components/primitives';

export default function ContactLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col">
      <div className="container mx-auto px-4 py-12 space-y-8 max-w-3xl">
        {/* Header placeholder */}
        <Skeleton className="h-9 w-48" />
        {/* Contact-info card placeholder */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        {/* Contact form placeholder */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
