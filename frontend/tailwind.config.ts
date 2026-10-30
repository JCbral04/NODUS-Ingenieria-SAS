import type { Config } from "tailwindcss";

// Cada color apunta a una variable de tema definida en src/app/globals.css.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        sunken: token("sunken"),
        line: { DEFAULT: token("line"), strong: token("line-strong") },
        ink: {
          DEFAULT: token("ink"),
          soft: token("ink-soft"),
          muted: token("ink-muted"),
        },
        primary: {
          DEFAULT: token("primary"),
          strong: token("primary-strong"),
          soft: token("primary-soft"),
        },
        "on-primary": token("on-primary"),
        accent: token("accent"),
        sidebar: {
          DEFAULT: token("sidebar"),
          ink: token("sidebar-ink"),
          line: token("sidebar-line"),
        },
        info: { DEFAULT: token("info"), soft: token("info-soft") },
        warn: { DEFAULT: token("warn"), soft: token("warn-soft") },
        flow: { DEFAULT: token("flow"), soft: token("flow-soft") },
        prop: { DEFAULT: token("prop"), soft: token("prop-soft") },
        ok: { DEFAULT: token("ok"), soft: token("ok-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
