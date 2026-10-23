/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#5289AD',
        'primary-soft': '#DCE8F0',
        ink: '#243C4C',
        info: '#698696',
        line: '#ACBCBF',
        'bg-main': '#F4FCFB',
        // Thêm nhóm 'bg' an toàn để triệt tiêu triệt để lỗi "Cannot read properties of undefined (reading 'bg')"
        bg: {
          main: '#F4FCFB',
          card: '#FFFFFF',
          soft: '#DCE8F0',
        },
        card: '#FFFFFF',
        success: '#2E7D4F',
        'success-soft': '#E3F1E8',
        danger: '#B3261E',
      },
    },
  },
  plugins: [],
};