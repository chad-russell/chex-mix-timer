import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'chexmas':
          'radial-gradient(ellipse at top, rgba(255,255,255,0.08), transparent 60%), radial-gradient(ellipse at bottom, rgba(255,255,255,0.06), transparent 60%), linear-gradient(120deg, #0b3d2e 0%, #0b3d2e 35%, #113b5b 100%)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        twinkle: 'twinkle 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        chexflat: {
          // Flat minimal theme with pastel accents
          primary: '#fda4af', // pastel red (rose-300)
          'primary-content': '#1f2937',
          secondary: '#86efac', // pastel green (emerald-300)
          accent: '#fde68a', // soft gold (amber-200)
          neutral: '#374151',
          'base-100': '#fafafa', // near-white
          'base-200': '#f4f4f5', // light gray
          'base-300': '#e4e4e7', // gray border
          info: '#93c5fd',
          success: '#86efac',
          warning: '#fde68a',
          error: '#fca5a5',
        },
      },
      'winter',
      'cupcake',
    ],
    logs: false,
  },
}
