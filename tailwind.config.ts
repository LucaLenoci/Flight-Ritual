// Aloft design system — Tailwind utilities are thin aliases over the CSS
// custom properties defined in src/styles/tokens/*.css, so components can
// use ordinary utility classes (bg-sky-500, text-rarity-legendary, ...)
// while the actual values live in one place (the token files).
//
// Colors are stored as oklch() values (see colors.css). withOpacity() uses
// CSS Color 4 relative-color syntax (`oklch(from <color> l c h / alpha)`)
// to support Tailwind opacity modifiers like bg-sky-500/15 without needing
// a separate "R G B" triplet representation.
function withOpacity(cssVariable: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `var(${cssVariable})`
      : `oklch(from var(${cssVariable}) l c h / ${opacityValue})`;
}

// Untyped: Tailwind's bundled Config type doesn't recognize the
// function-value color form (withOpacity) even though Tailwind itself
// supports and documents it at runtime.
const config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          50: withOpacity("--color-sky-50"),
          100: withOpacity("--color-sky-100"),
          200: withOpacity("--color-sky-200"),
          300: withOpacity("--color-sky-300"),
          400: withOpacity("--color-sky-400"),
          500: withOpacity("--color-sky-500"),
          600: withOpacity("--color-sky-600"),
          700: withOpacity("--color-sky-700"),
          800: withOpacity("--color-sky-800"),
          900: withOpacity("--color-sky-900"),
        },
        amber: { 400: withOpacity("--color-amber-400"), 500: withOpacity("--color-amber-500"), 600: withOpacity("--color-amber-600") },
        coral: { 400: withOpacity("--color-coral-400"), 500: withOpacity("--color-coral-500") },
        rarity: {
          common: withOpacity("--color-rarity-common"),
          uncommon: withOpacity("--color-rarity-uncommon"),
          rare: withOpacity("--color-rarity-rare"),
          legendary: withOpacity("--color-rarity-legendary"),
        },
        paper: {
          0: withOpacity("--color-paper-0"),
          50: withOpacity("--color-paper-50"),
          100: withOpacity("--color-paper-100"),
          200: withOpacity("--color-paper-200"),
        },
        neutral: {
          400: withOpacity("--color-neutral-400"),
          600: withOpacity("--color-neutral-600"),
          800: withOpacity("--color-neutral-800"),
          900: withOpacity("--color-neutral-900"),
        },
        bg: withOpacity("--color-bg"),
        surface: withOpacity("--color-surface"),
        "surface-raised": withOpacity("--color-surface-raised"),
        border: withOpacity("--color-border"),
        "text-primary": withOpacity("--color-text-primary"),
        "text-secondary": withOpacity("--color-text-secondary"),
        "text-tertiary": withOpacity("--color-text-tertiary"),
        "on-gradient": withOpacity("--color-text-on-gradient"),
        success: withOpacity("--color-success"),
        warning: withOpacity("--color-warning"),
        danger: withOpacity("--color-danger"),
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
      },
      letterSpacing: {
        eyebrow: "var(--tracking-eyebrow)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
      },
      aspectRatio: {
        card: "2.5 / 3.5",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        ui: "var(--shadow-ui)",
        "glow-uncommon": "var(--glow-uncommon)",
        "glow-rare": "var(--glow-rare)",
        "glow-legendary": "var(--glow-legendary)",
      },
      backgroundImage: {
        "gradient-golden-hour": "var(--gradient-golden-hour)",
        "gradient-sky-day": "var(--gradient-sky-day)",
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
        "out-soft": "var(--ease-out-soft)",
        standard: "var(--ease-standard)",
      },
      transitionDuration: {
        ui: "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
