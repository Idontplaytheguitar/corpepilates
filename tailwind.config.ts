import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff5f5',
          100: '#ffe0e0',
          200: '#ffc2c2',
          300: '#ff9999',
          400: '#ff6b6b',
          500: '#e85d5d',
          600: '#c44d4d',
          700: '#9c3f3f',
          800: '#7a3232',
          900: '#5c2626',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf8f0',
          200: '#faf0e0',
          300: '#f5e4c8',
          400: '#edd4a8',
          500: '#e3c088',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e4ebe4',
          200: '#c8d7c8',
          300: '#a3bda3',
          400: '#7a9e7a',
          500: '#5a7f5a',
        },
        nude: {
          50: '#fdf9f7',
          100: '#f9f0eb',
          200: '#f2e0d6',
          300: '#e8c9b8',
          400: '#d9a88f',
          500: '#c98b6c',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-lato)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
