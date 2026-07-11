export function Skeleton({ className = "" }: { className?: string }) {
  return <div role="presentation" className={`animate-pulse rounded-md bg-paper-200 dark:bg-surface-raised ${className}`} />;
}
