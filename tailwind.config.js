/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact Mixamo color palette (Adobe Creative Cloud colors)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main Mixamo blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Mixamo's dark theme colors (exact hex values)
        mixamo: {
          'bg-primary': '#1a1a1a',     // Main background
          'bg-secondary': '#2a2a2a',   // Panel backgrounds  
          'bg-tertiary': '#333333',    // Card/item backgrounds
          'border': '#404040',         // Border color
          'border-light': '#505050',   // Lighter borders
          'text-primary': '#ffffff',   // Primary text
          'text-secondary': '#cccccc', // Secondary text
          'text-muted': '#999999',     // Muted text
          'accent': '#0084ff',         // Mixamo accent blue
          'accent-hover': '#0066cc',   // Accent hover state
          'success': '#00cc66',        // Success/active states
          'warning': '#ff9900',        // Warning states
          'error': '#ff3366',          // Error states
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
