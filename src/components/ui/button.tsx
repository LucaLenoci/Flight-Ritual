import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gradient";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-sky-500 text-white",
  secondary: "bg-paper-100 text-text-primary dark:bg-surface-raised",
  ghost: "bg-transparent text-text-secondary border border-border",
  gradient: "bg-gradient-golden-hour text-on-gradient",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Ordinary UI never gets spring/bounce per the motion spec — buttons
 * brighten on hover and scale down slightly on press, with a short
 * ease-standard transition. No color-swap/darkening hovers.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-semibold transition-all duration-ui ease-standard hover:brightness-[1.06] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
