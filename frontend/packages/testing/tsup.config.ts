import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', setup: 'src/setup.ts' },
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
