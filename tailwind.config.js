import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
        'bounce-gentle': {
          '0%, 100%': { 'transform': 'translateY(0)' },
          '50%': { 'transform': 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { 'transform': 'rotate(-3deg)' },
          '50%': { 'transform': 'rotate(3deg)' },
        },
      },
      animation: {
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 3s ease-in-out infinite',
        wiggle: 'wiggle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        christmas: {
          // Winter Christmas theme with green primary and icy blue background
          primary: '#16a34a', // Christmas green
          'primary-content': '#ffffff',
          'primary-focus': '#15803d', // darker green for focus states
          secondary: '#22c55e', // lighter green  
          'secondary-content': '#ffffff',
          accent: '#fbbf24', // golden yellow
          neutral: '#64748b',
          'base-100': '#f0f9ff', // icy pale blue
          'base-200': '#e0f2fe', // lighter icy blue
          'base-300': '#bae6fd', // soft ice blue for borders
          info: '#0ea5e9', // ice blue
          success: '#16a34a', // Christmas green
          warning: '#fbbf24', // golden yellow
          error: '#dc2626', // Christmas red
        },
      },
    ],
    logs: false,
  },
}
