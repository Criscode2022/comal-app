/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#F4F2EF',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#5C5955',
          subtle: '#8A8680',
        },
        border: '#E0DCD6',
        primary: {
          DEFAULT: '#E85D04',
          strong: '#C44D03',
          soft: '#FFF0E6',
        },
        secondary: {
          DEFAULT: '#5C6B5A',
          soft: '#E8EDE7',
        },
        danger: {
          DEFAULT: '#B42318',
          soft: '#FEE4E2',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
