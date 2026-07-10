import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ink-700/60 bg-ink-900/60 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] ${className}`}
      {...props}
    />
  );
}
