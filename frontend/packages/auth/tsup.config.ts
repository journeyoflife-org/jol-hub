import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'middleware/parish-guard': 'src/middleware/parish-guard.ts',
    'hooks/useBitrixAuth': 'src/hooks/useBitrixAuth.ts',
    'lib/bitrix-api': 'src/lib/bitrix-api.ts',
    'oidc/index': 'src/oidc/index.ts',
    'oidc/hooks': 'src/oidc/hooks.ts',
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
