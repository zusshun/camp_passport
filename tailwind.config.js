/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FAF3E3', deep: '#F2E8CF' },
        paper: '#FFFBF1',
        ink: { DEFAULT: '#1B2A4A', soft: '#4B5878', faint: '#8B93A8' },
        lav: { DEFAULT: '#B9A8F0', soft: '#E9E3FB', deep: '#6A52CC' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        body: ['"DM Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 0 rgba(27,42,74,0.04), 0 10px 30px -12px rgba(27,42,74,0.22)',
        lift: '0 2px 0 rgba(27,42,74,0.05), 0 18px 40px -16px rgba(27,42,74,0.3)',
      },
    },
  },
  plugins: [],
}
