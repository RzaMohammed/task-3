/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        goa: {
          bg: '#062e1a',         // Deep tropical forest green
          dark: '#041f11',       // Ultra deep green
          card: '#0a3d24',       // Lush emerald card background
          cardHover: '#0e4e2f',  // Slightly brighter card hover
          border: '#16623a',     // Emerald border
          borderGlow: '#22c55e', // Vibrant green border highlight
          yellow: '#ffd60a',     // Sunshine yellow from referral
          yellowLight: '#ffea75',// Pale golden sun
          yellowDark: '#eab308', // Deep amber yellow
          pink: '#ff2a85',       // Signature hot pink from "गोवा"
          pinkLight: '#ff66a8',  // Light neon magenta
          sand: '#fdfbf7',       // White beach sand
          sandMuted: '#cbd5c5',  // Muted sage/sand
          emerald: '#10b981',    // Vibrant tropical green
          sunray: 'rgba(255, 214, 10, 0.15)'
        },
        dark: {
          bg: '#062e1a',
          card: '#0a3d24',
          border: '#16623a',
          text: '#fdfbf7',
          muted: '#a7bda9',
          accent: '#ffd60a',
          success: '#10b981',
          danger: '#ff2a85',
          warning: '#ffd60a'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Cinzel', 'Georgia', 'serif'],
        devanagari: ['"Rozha One"', '"Yatra One"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
