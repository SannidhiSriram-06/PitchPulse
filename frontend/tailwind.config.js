module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0C0C0C",
          light: "#FAFAF8"
        },
        surface: {
          DEFAULT: "#141414",
          raised: "#1C1C1C",
          light: "#FFFFFF",
          "raised-light": "#F5F5F2"
        },
        accent: {
          DEFAULT: "#FF6B2C",
          light: "#E8541A",
          dim: "rgba(255,107,44,0.12)"
        },
        tx: {
          primary: "#F2F2F2",
          secondary: "#888888",
          tertiary: "#555555",
          "primary-light": "#0C0C0C",
          "secondary-light": "#555555",
          "tertiary-light": "#999999"
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.08)",
          strong: "rgba(0,0,0,0.12)"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["Berkeley Mono", "JetBrains Mono", "monospace"]
      },
      borderRadius: {
        tight: "6px",
        DEFAULT: "10px",
        lg: "14px",
        xl: "20px"
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: []
}
