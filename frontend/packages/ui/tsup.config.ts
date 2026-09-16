import { defineConfig, type Options } from 'tsup';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BANNER = '"use client";\n';

/**
 * Post-build hook — prepends `"use client";` to every JS file in dist/.
 *
 * Why: tsup with `splitting: true` creates shared chunks that lose the
 * per-source `'use client'` directive.  Next.js App Router needs the
 * directive on ANY module whose graph contains React hooks (useState,
 * useRef, useEffect …).  This ensures every emitted chunk carries it.
 */
function addUseClientBanner(): Options['buildSuccess'] {
  return function (config) {
    const outDir = config.outDir ?? 'dist';
    const files = readdirSync(outDir);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
        const filePath = join(outDir, file);
        const content = readFileSync(filePath, 'utf8');
        if (!content.startsWith('"use client"')) {
          writeFileSync(filePath, BANNER + content);
        }
      }
    }
  };
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tokens/index': 'src/tokens/index.ts',
    'providers/index': 'src/providers/index.ts',
    'components/primitives/index': 'src/components/primitives/index.ts',
    'components/composite/index': 'src/components/composite/index.ts',
    'components/layout/index': 'src/components/layout/index.ts',
    'components/accessibility/index': 'src/components/accessibility/index.ts',
    'components/locale-switcher/index': 'src/components/locale-switcher/index.ts',
    'dev/Showcase': 'src/dev/Showcase.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  outDir: 'dist',
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  async onSuccess() {
    const outDir = 'dist';
    const files = readdirSync(outDir);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
        const filePath = join(outDir, file);
        const content = readFileSync(filePath, 'utf8');
        if (!content.startsWith('"use client"')) {
          writeFileSync(filePath, BANNER + content);
        }
      }
    }
    console.log('[use-client] Banner injected into', files.filter(
      f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs')
    ).length, 'files');
  },
});
