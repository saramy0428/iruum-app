/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:       "#f0f0ff",   // primary text — near-white on indigo
        paper:     "#1e1b4b",   // deep indigo background
        vermilion: "#818cf8",   // lavender accent
        stone:     "#a5b4fc",   // secondary text — soft lavender
        mist:      "#312e81",   // subtle dividers / hover surfaces
        rice:      "#2d2a6e",   // card / section surface (medium indigo)
      },
      fontFamily: {
        display:  ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        serif:    ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        sans:     ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        korean:   ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
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
