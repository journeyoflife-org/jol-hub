import { defineConfig } from 'tsup';

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
});
