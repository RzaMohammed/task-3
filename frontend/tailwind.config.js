/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d1117',       // GitHub-like deep black/gray
          card: '#161b22',     // Dark slate gray cards
          border: '#30363d',   // Medium gray borders
          text: '#c9d1d9',     // Muted white text
          muted: '#8b949e',    // Subtle gray text
          accent: '#58a6ff',   // Electric blue highlights
          success: '#2ea44f',  // Emerald green
          danger: '#f85149',   // Crimson red
          warning: '#d29922'   // Warm yellow/amber
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
