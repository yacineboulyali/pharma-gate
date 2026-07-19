/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media', // suit automatiquement les préférences système (prefers-color-scheme)
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pharmacy: {
          green:      '#1a7f4b',
          'green-light': '#e8f5ee',
          'green-mid':   '#2e9e62',
          orange:     '#c85a1e',
          'orange-light': '#fdf0e8',
        },
      },
    },
  },
  plugins: [],
}
