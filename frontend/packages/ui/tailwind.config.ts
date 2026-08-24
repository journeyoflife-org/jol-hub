import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

import { jolThemeExtension } from './src/tokens/tailwind';

/**
 * JOL Design System Tailwind configuration.
 *
 * - `darkMode: 'class'` — tenants (or user preference) control the mode;
 *   never `media`, because a tenant theme may override the OS preference.
 * - Design tokens are the only source of color/spacing/type values;
 *   no hex literals may be added directly to this file.
 * - The shadcn-style `hsl(var(--*))` component mappings below are retained
 *   for backwards compatibility with existing components; new surfaces
 *   should use the token scales (`neutral-*`, `primary-*`, ...) and the
 *   generated `--jol-*` CSS custom properties.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      ...jolThemeExtension,
      colors: {
        ...jolThemeExtension.colors,
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          ...jolThemeExtension.colors.primary,
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          ...jolThemeExtension.colors.secondary,
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          ...jolThemeExtension.colors.accent,
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        ...jolThemeExtension.borderRadius,
        // shadcn compatibility aliases (kept after token spread on purpose)
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
