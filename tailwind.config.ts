import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#EDEEEA',
          card: '#F7F7F3',
          line: '#DCDCD3',
        },
        ink: {
          DEFAULT: '#20242A',
          soft: '#565B62',
          faint: '#8A8F94',
        },
        verdigris: {
          DEFAULT: '#3F7D74',
          dark: '#2E5C55',
          light: '#DCEBE8',
        },
        amber: {
          DEFAULT: '#C98A2E',
          light: '#F3E5CB',
        },
        clay: {
          DEFAULT: '#B5533C',
          light: '#F3DDD6',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        ledger: '0 1px 0 0 rgba(32,36,42,0.06)',
        card: '0 1px 2px rgba(32,36,42,0.06), 0 8px 24px -12px rgba(32,36,42,0.18)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
export default config
