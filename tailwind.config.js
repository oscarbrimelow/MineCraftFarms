/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        minecraft: {
          green: '#7CB342',
          'green-dark': '#558B2F',
          'green-light': '#AED581',
          indigo: '#5C6BC0',
          'indigo-dark': '#3949AB',
          'indigo-light': '#9FA8DA',
          gold: '#FFB300',
          'gold-dark': '#F57C00',
          'gold-light': '#FFD54F',
          dirt: '#8B6914',
          stone: '#9E9E9E',
          grass: '#7CB342',
          'sky-light': '#87CEEB',
          'sky-dark': '#4682B4',
        },
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      boxShadow: {
        'minecraft': '8px 8px 0px 0px rgba(0,0,0,0.2)',
        'minecraft-sm': '4px 4px 0px 0px rgba(0,0,0,0.2)',
        'minecraft-lg': '12px 12px 0px 0px rgba(0,0,0,0.2)',
        'glow': '0 0 20px rgba(124, 179, 66, 0.5)',
        'glow-gold': '0 0 20px rgba(255, 179, 0, 0.5)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};

