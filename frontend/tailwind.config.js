/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        head: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        accent: {
          red:    '#e63946',
          orange: '#f4842d',
          blue:   '#3a86ff',
          green:  '#06d6a0',
          purple: '#8338ec',
        }
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
      }
    }
  },
  plugins: []
}
