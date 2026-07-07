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
          DEFAULT: '#1a365d',
          foreground: '#FAFAF9',
        },
        secondary: {
          DEFAULT: '#2c5282',
          foreground: '#FAFAF9',
        },
        accent: {
          DEFAULT: '#d69e2e',
          foreground: '#1a365d',
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
