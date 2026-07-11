const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({
  value,
  total,
  size = 56,
  label,
}: {
  value: number;
  total: number;
  size?: number;
  label?: string;
}) {
  const fraction = total > 0 ? Math.min(1, value / total) : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="text-sky-500 transition-all duration-500 ease-out-soft"
        />
      </svg>
      <span className="absolute font-mono text-xs font-medium text-text-primary">
        {label ?? `${value}/${total}`}
      </span>
    </div>
  );
}
