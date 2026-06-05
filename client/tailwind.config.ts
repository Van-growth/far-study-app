import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', '"Noto Sans"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: '#fafaf8',
        surface: '#ffffff',
        surface2: '#f3f3f0',
        primary: '#4f6ef7',
        muted: '#555555',
        border: '#e8e8e4',
        'border-strong': '#d0d0c8',
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
