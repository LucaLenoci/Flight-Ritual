export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
      <p className="text-xs uppercase tracking-wider text-mist-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium text-mist-100">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-mist-400">{hint}</p>}
    </div>
  );
}
