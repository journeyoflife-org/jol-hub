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
    client: 'src/client.ts',
    server: 'src/server.ts',
    middleware: 'src/middleware.ts',
    'middleware/language': 'src/middleware/language.ts',
    config: 'src/config.ts',
    types: 'src/types.ts',
    'messages/index': 'src/messages/index.ts',
    'components/translation-provider': 'src/components/translation-provider.tsx',
    'hooks/use-translations': 'src/hooks/use-translations.ts',
    'hooks/use-locale-context': 'src/hooks/use-locale-context.ts',
    utils: 'src/utils.ts',
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
