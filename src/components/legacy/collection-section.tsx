export function CollectionSection({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-mist-400">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-mist-500">{emptyLabel}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-ink-700 bg-ink-900/60 px-2.5 py-1 font-mono text-xs text-mist-200"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
