/**
 * Build-output measurement — STEP 13.
 *
 * Measures GZIPPED transfer sizes (what the Dell R640 actually serves when
 * nginx proxies with gzip/brotli; gzip is the conservative baseline) from a
 * Next.js App Router build:
 *
 *   - route footprints come from `.next/app-build-manifest.json` (the exact
 *     file set Next ships for each route's first load);
 *   - file reading is INJECTED so the core stays pure/testable (the CLI
 *     script wires `fs`).
 */
import { gzipSync } from 'node:zlib';

import type { RouteFootprint } from './types';

/** Gzipped size (level 9 — matches conservative transfer estimates). */
export function gzipSize(content: Buffer | string): number {
  return gzipSync(content, { level: 9 }).length;
}

export function bytesToKiB(bytes: number): number {
  return bytes / 1024;
}

export function formatKiB(bytes: number): string {
  return `${bytesToKiB(bytes).toFixed(1)} KiB`;
}

/** Shape of `.next/app-build-manifest.json`. */
export interface AppBuildManifest {
  pages: Record<string, string[]>;
}

/**
 * Resolve one asset (relative to `.next/`, e.g. `static/chunks/x.js`) to its
 * content. Returns null when the asset is absent (e.g. dev-only entries).
 */
export type AssetReader = (relPath: string) => Buffer | null;

/** Routes that never ship to real users (dev showcase, error internals). */
const NON_USER_ROUTES = /^\/(dev\/|not-found|_not-found)/;

/**
 * Compute the gzipped first-load JS/CSS footprint of EVERY user-facing route
 * in the manifest. CSS in the App Router is shared across routes; it is
 * counted per route because it loads on first paint.
 */
export function computeRouteFootprints(
  manifest: AppBuildManifest,
  readAsset: AssetReader,
): RouteFootprint[] {
  const cache = new Map<string, number>();
  const sizeOf = (relPath: string): number => {
    const cached = cache.get(relPath);
    if (cached !== undefined) return cached;
    const content = readAsset(relPath);
    const size = content ? gzipSize(content) : 0;
    cache.set(relPath, size);
    return size;
  };

  const footprints: RouteFootprint[] = [];
  for (const [route, files] of Object.entries(manifest.pages)) {
    if (NON_USER_ROUTES.test(route)) continue;

    const unique = Array.from(new Set(files));
    let jsGzipBytes = 0;
    let cssGzipBytes = 0;
    for (const file of unique) {
      if (file.endsWith('.js')) jsGzipBytes += sizeOf(file);
      else if (file.endsWith('.css')) cssGzipBytes += sizeOf(file);
    }
    footprints.push({ route, jsGzipBytes, cssGzipBytes });
  }

  // Largest-first: the worst route gates the build.
  footprints.sort((a, b) => b.jsGzipBytes + b.cssGzipBytes - (a.jsGzipBytes + a.cssGzipBytes));
  return footprints;
}
