import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00843D',
          50: '#E6F5EC',
          100: '#CCEADA',
          200: '#99D5B5',
          300: '#66C08F',
          400: '#33AB6A',
          500: '#00843D',
          600: '#006A31',
          700: '#005025',
          800: '#003518',
          900: '#001B0C',
        },
        secondary: {
          DEFAULT: '#FFCC00',
          50: '#FFFBEB',
          100: '#FFF7D6',
          200: '#FFEFAD',
          300: '#FFE785',
          400: '#FFDF5C',
          500: '#FFCC00',
          600: '#CCA300',
          700: '#997A00',
          800: '#665200',
          900: '#332900',
        },
        accent: {
          DEFAULT: '#C8102E',
          50: '#FCE8EB',
          100: '#F9D1D7',
          200: '#F3A3AF',
          300: '#ED7587',
          400: '#E7475F',
          500: '#C8102E',
          600: '#A00D25',
          700: '#780A1C',
          800: '#500713',
          900: '#280409',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
