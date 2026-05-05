/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:       "#1a1a1a",   // primary text — near-black
        paper:     "#faf8f3",   // warm cream background
        vermilion: "#c8392b",   // Korean stamp ink red — sparingly
        stone:     "#8a8480",   // secondary text
        mist:      "#e8e4dc",   // subtle dividers / hover surfaces
        rice:      "#f3efe6",   // alt surface (slightly warmer than paper)
      },
      fontFamily: {
        display:  ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif:    ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:     ['"Inter Tight"', 'system-ui', 'sans-serif'],
        korean:   ['"Noto Serif KR"', '"Cormorant Garamond"', 'serif'],
      },
      letterSpacing: {
        widest: "0.18em",
      },
      animation: {
        "stamp-in": "stampIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "fade-up":  "fadeUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
      keyframes: {
        stampIn: {
          "0%":   { opacity: "0", transform: "scale(1.15)" },
          "60%":  { opacity: "1", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
