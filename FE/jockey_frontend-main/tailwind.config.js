/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#fafaf9',
          100: '#F5F1E8',
          200: '#e7e5e4',
          300: '#d6d3d1',
        },
        brand: {
          DEFAULT: '#103B2F', // shared brand palette
          accent: '#C6A15B',
          accentSoft: '#F2D78F', // soft gold
          accentFaint: '#FBF2D0', // pale gold
        },
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'System'],
        'sans-medium': ['DMSans_500Medium', 'System'],
        'sans-semibold': ['DMSans_600SemiBold', 'System'],
        'sans-bold': ['DMSans_700Bold', 'System'],
        display: ['LibreCaslonDisplay_400Regular', 'Georgia'],
      },
    },
  },
  plugins: [],
};
