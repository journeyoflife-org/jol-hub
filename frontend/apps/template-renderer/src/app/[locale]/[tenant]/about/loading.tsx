/**
 * About loading skeleton — STEP 6.
 *
 * Shown during streaming / client navigation to `/about`. `/about` never calls
 * `notFound()` for a known tenant, so a loading boundary here is safe.
 *
 * NOTE: there is deliberately NO `loading.tsx` at the `[tenant]/` level — its
 * implicit Suspense boundary would turn `notFound()` responses on the
 * collection detail routes into soft-200s (a documented Next.js limitation),
 * breaking the hard "slug not found → 404" SEO rule. See RENDERING.md.
 */
import { Skeleton } from '@jol-hub/ui/components/primitives';

export default function AboutLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col">
      {/* Hero placeholder */}
      <div className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 space-y-4">
          <Skeleton className="mx-auto h-10 w-2/3 max-w-xl" />
          <Skeleton className="mx-auto h-5 w-1/2 max-w-md" />
        </div>
      </div>
      {/* Content placeholder */}
      <div className="container mx-auto px-4 pb-16 max-w-3xl space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
