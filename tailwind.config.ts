import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F1EA",
        paper2: "#EAE5DA",
        card: "#FFFDF8",
        ink: "#141414",
        muted: "#6E6A61",
        line: "rgba(20,20,20,0.12)",
        fire: "#FF4D1F",
        hot: "#FF8A1F",
        rising: "#F2B705",
        steady: "#5B8DEF",
        cooling: "#8AA9C2",
        dormant: "#A8A296",
        live: "#18A957",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(20,20,20,0.04), 0 12px 32px -12px rgba(20,20,20,0.18)",
        lift: "0 2px 0 rgba(20,20,20,0.05), 0 28px 60px -24px rgba(20,20,20,0.35)",
        sticker: "0 0 0 3px #fff, 0 10px 24px -8px rgba(20,20,20,0.35)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        pulseSoft: {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(1.18)", opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        pulseRing: "pulseRing 1.8s ease-out infinite",
        pulseSoft: "pulseSoft 1.6s ease-out infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
