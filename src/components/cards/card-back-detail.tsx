import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { CardRarityDto } from "../../lib/api-types";
import { RarityBadge } from "../ui/rarity-badge";

export interface CardDetailRow {
  label: string;
  value: string;
}

/** The "back" face of a flipped card: full detail, not just the teaser front shows. */
export function CardBackDetail({
  kind,
  title,
  rarity,
  rows,
  funFact,
  firstCollectedLabel,
}: {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  title: string;
  rarity: CardRarityDto;
  rows: CardDetailRow[];
  funFact?: string;
  firstCollectedLabel: string | null;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-card border-2 border-border bg-surface-raised p-5 shadow-card">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-text-secondary">{kind}</span>
          <RarityBadge rarity={rarity} />
        </div>
        <h3 className="mt-2 font-display text-xl italic text-text-primary">{title}</h3>

        <dl className="mt-4 space-y-2 border-t border-border pt-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-text-secondary">{row.label}</dt>
              <dd className="font-mono text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-border pt-3">
        {funFact && (
          <p className="flex items-start gap-1.5 text-xs text-text-secondary">
            <Sparkle className="mt-0.5 shrink-0" aria-hidden="true" />
            {funFact}
          </p>
        )}
        {firstCollectedLabel && (
          <p className="mt-2 font-mono text-[11px] text-text-secondary">{firstCollectedLabel}</p>
        )}
      </div>
    </div>
  );
}
