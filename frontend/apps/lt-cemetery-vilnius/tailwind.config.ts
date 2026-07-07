import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d5016',
          50: '#f0f5eb',
          100: '#dbe8d0',
          200: '#b8d19e',
          300: '#8fb96a',
          400: '#6a9f44',
          500: '#4d8528',
          600: '#3b6a1e',
          700: '#2d5016',
          800: '#254112',
          900: '#1a2e0c',
        },
        cemetery: {
          stone: '#8b8680',
          granite: '#4a4a4a',
          marble: '#f5f5f0',
          grass: '#4a7c23',
          bronze: '#cd7f32',
        },
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
