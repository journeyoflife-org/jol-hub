import type { Config } from 'tailwindcss';

import { jolThemeExtension } from '@journeyoflife-org/ui/tokens';

/**
 * Template renderer Tailwind config.
 *
 * All design values come from the JOL Design System token bridge
 * (`@journeyoflife-org/ui/tokens`) — no hex literals live in this file
 * (design-system rule: tokens are the single source of truth).
 *
 * `darkMode: 'class'` — the ThemeProvider (or a tenant override) controls
 * the mode; never a media query.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: jolThemeExtension as unknown as Config['theme'],
  },
  plugins: [],
};

export default config;
