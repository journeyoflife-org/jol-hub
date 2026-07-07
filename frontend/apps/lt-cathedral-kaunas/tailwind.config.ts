import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        liturgical: {
          green: '#3D8B40',
          purple: '#6B3FA0',
          red: '#C41E3A',
          white: '#FAFAFA',
          rose: '#E8B4B8',
          gold: '#FFD700',
        },
        primary: {
          DEFAULT: '#1D2E28',
          foreground: '#FAFAF9',
        },
        secondary: {
          DEFAULT: '#8A9A8B',
          foreground: '#FAFAF9',
        },
        accent: {
          DEFAULT: '#C9A86C',
          foreground: '#1D2E28',
        },
      },
      fontFamily: {
        heading: ['Crimson Text', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
