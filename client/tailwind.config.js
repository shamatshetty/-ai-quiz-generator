/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        dark: {
          950: '#070A0F',
          900: '#0B0F17',
          850: '#101622',
          800: '#161F30',
          750: '#1C273C',
          700: '#24324D'
        },
        kahoot: {
          red: '#E21B3C',
          blue: '#1368CE',
          yellow: '#D89E00',
          green: '#26890C',
          purple: '#46178F',
          darkPurple: '#2D0F5E'
        }
      },
      boxShadow: {
        'tactile-red': '0 6px 0 #9f1239, 0 12px 24px rgba(225,29,72,0.35)',
        'tactile-blue': '0 6px 0 #1e40af, 0 12px 24px rgba(37,99,235,0.35)',
        'tactile-yellow': '0 6px 0 #b45309, 0 12px 24px rgba(217,119,6,0.35)',
        'tactile-green': '0 6px 0 #065f46, 0 12px 24px rgba(16,185,129,0.35)',
        'tactile-purple': '0 6px 0 #581c87, 0 12px 24px rgba(147,51,234,0.35)',
        'realistic-card': '0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 1px 0 rgba(255,255,255,0.12)',
        'realistic-glow': '0 0 35px rgba(147,51,234,0.2), 0 20px 40px -15px rgba(0,0,0,0.8), inset 0 1px 1px 0 rgba(255,255,255,0.15)',
        'multi-ambient': '0 1px 2px -1px rgba(0,0,0,0.4), 0 4px 12px -2px rgba(0,0,0,0.5), 0 16px 36px -6px rgba(0,0,0,0.65), inset 0 1px 1px 0 rgba(255,255,255,0.12)'
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' }
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-glow': 'pulseGlow 1.5s infinite'
      }
    },
  },
  plugins: [],
}
