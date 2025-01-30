import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        dark: {
          1: '#8B6F47', // Warm mocha brown (white text readable)  
          2: '#D1BFA3', // Muted beige brown  
          3: '#E3D5C3', // Soft sand  
          4: '#F2E8DA', // Light cream  
          5: '#7A5C3E', // Rich walnut brown (earthy, warm)  
        },
        blue: {
          1: '#A67C52', // Soft rose pink  
        },
        green: {
          1: '#27AE60', // Fresh mint green  
        },
        red: {
          1: '#E74C3C', // Soft coral red  
        },
        orange: {
          1: '#F39C12', // Warm sunset orange  
        },
        purple: {
          1: '#9B59B6', // Light royal purple  
        },
        yellow: {
          1: '#F1C40F', // Bright golden yellow  
        },
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
      backgroundImage: {
        hero: "url('/images/background.jpg')",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
