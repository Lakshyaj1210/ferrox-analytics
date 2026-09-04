/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Munsell soil-chart inspired ground tones
        loam: {
          950: "#1C1712",
          900: "#241D16",
          800: "#2E2519",
          700: "#3F3226",
          600: "#5A4735",
        },
        parchment: {
          100: "#EFE9DA",
          200: "#E3DAC4",
          300: "#CBBFA0",
        },
        chlorophyll: {
          400: "#9DBE55",
          500: "#8BAF3F",
          600: "#6E8F30",
        },
        ochre: {
          400: "#E4A64A",
          500: "#D98B2B",
          600: "#B36F1E",
        },
        rust: {
          400: "#C96246",
          500: "#B8452F",
          600: "#973823",
        },
        signal: {
          300: "#7EE0D6",
          400: "#4FD1C5",
          500: "#33B0A5",
        },
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"Inter\"", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "monospace"],
      },
      backgroundImage: {
        contour:
          "radial-gradient(circle at 20% 20%, rgba(139,175,63,0.06), transparent 40%), radial-gradient(circle at 80% 60%, rgba(79,209,197,0.05), transparent 45%)",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(239,233,218,0.06) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
