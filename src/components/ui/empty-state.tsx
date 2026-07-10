import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700 px-6 py-12 text-center">
      {icon && (
        <div aria-hidden="true" className="text-3xl text-mist-400">
          {icon}
        </div>
      )}
      <p className="font-display text-lg text-mist-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-mist-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
