import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: '#f0f4f8',
        surface: '#ffffff',
        primary: '#4f6ef7',
        muted: '#64748b',
        border: '#e2e8f0',
        correct: { DEFAULT: '#22c55e', light: '#f0fdf4' },
        wrong: { DEFAULT: '#ef4444', light: '#fff5f5' },
        warn: { DEFAULT: '#f59e0b', light: '#fffbeb' },
        area1: '#4f6ef7',
        area2: '#0ea5e9',
        area3: '#10b981',
        area4: '#f59e0b',
        area5: '#8b5cf6',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
} satisfies Config
