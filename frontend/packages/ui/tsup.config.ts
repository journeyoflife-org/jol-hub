import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function walkJsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkJsFiles(full));
    } else if (/\.(js|mjs|cjs)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
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
  onSuccess: async () => {
    const banner = '"use client";\n';
    let count = 0;
    for (const fp of walkJsFiles('dist')) {
      const content = readFileSync(fp, 'utf8');
      if (!content.startsWith('"use client"')) {
        writeFileSync(fp, banner + content);
        count++;
      }
    }
    console.log('[use-client] Banner injected into ' + count + ' files');
  },
});
