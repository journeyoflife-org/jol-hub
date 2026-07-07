import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Byzantine/Greek Catholic colors
        'byzantine-gold': '#D4AF37',
        'byzantine-red': '#8B0000',
        'byzantine-blue': '#1E3A5F',
        'byzantine-purple': '#4A0080',
        'icon-blue': '#4169E1',
        'icon-red': '#DC143C',
      },
      fontFamily: {
        byzantine: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
