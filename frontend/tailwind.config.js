/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        background: "#F7F5EE",
        surface: "#FFFFFF",
        surfaceSoft: "#FBFAF4",
        border: "#E5E3DA",
        text: "#1F2937",
        muted: "#6B7280",

        primary: {
          DEFAULT: "#006D5B",
          hover: "#005546",
          light: "#E7F4F0",
        },

        status: {
          success: {
            bg: "#ECFDF3",
            border: "#A6F4C5",
            text: "#166534",
            accent: "#22C55E",
          },
          warning: {
            bg: "#FFF8E6",
            border: "#F7D58A",
            text: "#92400E",
            accent: "#F59E0B",
          },
          error: {
            bg: "#FDECEC",
            border: "#F5B5B5",
            text: "#991B1B",
            accent: "#EF4444",
          },
          info: {
            bg: "#EFF6FF",
            border: "#B6D4FE",
            text: "#1E3A8A",
            accent: "#3B82F6",
          },
          neutral: {
            bg: "#F8FAFC",
            border: "#CBD5E1",
            text: "#334155",
            accent: "#64748B",
          },
        },
      },

      boxShadow: {
        card: "0 1px 2px rgba(31,41,55,.04), 0 8px 24px rgba(31,41,55,.05)",
        lift: "0 2px 8px rgba(0,109,91,.08), 0 12px 32px rgba(31,41,55,.10)",
      },

      borderRadius: {
        card: "14px",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          from: { opacity: "0", transform: "translateY(10px) scale(.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(0,109,91,.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(0,109,91,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(0,109,91,0)" },
        },
      },

      animation: {
        "fade-in": "fadeIn .35s ease-out both",
        pop: "pop .28s cubic-bezier(.16,1,.3,1) both",
        "pulse-ring": "pulseRing 1.8s ease-out infinite",
      },
    },
  },

  plugins: [],
};
