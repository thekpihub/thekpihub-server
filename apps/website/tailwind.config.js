/** @type {import('tailwindcss').Config} */
// The KPI Hub — landing redesign. Brand tokens mirror colors_and_type.css.
module.exports = {
  content: ['./index.html', './landing/**/*.{js,jsx}'],
  // Utilities-only: keep the existing landing.css intact for not-yet-converted
  // sections (Tailwind's reset would otherwise wipe their base styles mid-migration).
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: '#06071A',
        'bg-2': '#0C0E28',
        'bg-3': '#111637',
        card: '#0C0E28',
        gold: '#E9A123',
        'gold-soft': 'rgba(233,161,35,0.06)',
        teal: '#00C9A7',
        red: '#FF6B6B',
        ink: '#EAEDF5', // primary text
        'ink-2': 'rgba(234,237,245,0.62)',
        'ink-3': 'rgba(234,237,245,0.32)',
        line: 'rgba(234,237,245,0.10)',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        head: ['Beiruti', '"Trebuchet MS"', 'sans-serif'],
        body: ['Manrope', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      maxWidth: { content: '1200px' },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', pill: '100px' },
      boxShadow: {
        'gold-glow': '0 0 0 1px rgba(233,161,35,0.28), 0 18px 60px -20px rgba(233,161,35,0.35)',
        card: '0 10px 40px -16px rgba(0,0,0,0.6)',
      },
      transitionTimingFunction: { brand: 'cubic-bezier(0.16,1,0.3,1)' },
    },
  },
  plugins: [],
};
