/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        quantum: {
          primary: '#6366f1',
          accent: '#22d3ee',
          dark: '#0b1020',
          panel: '#111733',
          green: '#00e599',
          'green-hover': '#00d488',
          'landing-bg': '#070d1a',
          'landing-card': '#0b1120',
          'landing-darker': '#080f1e',
        },
      },
    },
  },
  plugins: [],
};
