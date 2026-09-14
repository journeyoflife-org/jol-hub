import { defineConfig } from 'tsup';

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
});
