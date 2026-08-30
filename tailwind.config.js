/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Moodseed 设计令牌：从「土壤/破败」到「萌芽/绿意」
        cream: '#FAF7F0',
        sand: '#F0EBDF',
        ink: '#2E3A2E',
        soil: '#6B5B4E',
        stone: '#B9B4A9', // 破败灰
        moss: '#5B8C5A', // 主绿
        leaf: '#4C7A4E', // 深绿
        sprout: '#8FC08A', // 浅绿
        lime: '#C9E3B8',
        gold: '#D9A441', // 幸运/积分点缀
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"PingFang SC"',
          '"Noto Sans SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 2px 12px rgba(46, 58, 46, 0.08)',
        lift: '0 8px 30px rgba(46, 58, 46, 0.14)',
        glow: '0 0 40px rgba(143, 192, 138, 0.55)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'flip-spin': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        float: 'float 3s ease-in-out infinite',
        'flip-spin': 'flip-spin 1.4s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
