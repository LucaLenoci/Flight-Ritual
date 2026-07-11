import { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

/** Filled tint + colored border when active, ghost (outline only) otherwise. Short standard transition, no bounce. */
export function Chip({ active = false, icon, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-all duration-ui ease-standard hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
        active
          ? "border-sky-500 bg-sky-500/12 text-sky-700 dark:text-sky-300"
          : "border-border bg-transparent text-text-secondary"
      } ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
