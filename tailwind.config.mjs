/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0A1128', // Dark blue, inspired by Digitap's background
        'primary-light': '#1D2A4A', // Slightly lighter blue for contrast
        'accent-green': '#00C853', // Vibrant green for CTAs
        'accent-purple': '#6200EA', // Deep purple, another Digitap accent
        'text-light': '#F0F0F0', // Light text on dark backgrounds
        'text-dark': '#333333',   // Dark text on light backgrounds
      },
    },
  },
  plugins: [],
}