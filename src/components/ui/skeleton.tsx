export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={`animate-shimmer rounded-md bg-gradient-to-r from-ink-800 via-ink-700 to-ink-800 bg-[length:200%_100%] ${className}`}
    />
  );
}
