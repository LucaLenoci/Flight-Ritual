import type { CardRarityDto } from "../../lib/api-types";

const RARITY_STYLES: Record<CardRarityDto, string> = {
  COMMON: "bg-rarity-common/15 text-rarity-common",
  UNCOMMON: "bg-rarity-uncommon/15 text-rarity-uncommon",
  RARE: "bg-rarity-rare/15 text-rarity-rare shadow-glow-rare",
  LEGENDARY: "bg-rarity-legendary/15 text-rarity-legendary shadow-glow-legendary",
};

/** Rarity is legible by color alone — border/glow/badge always carry the tier hue, never just flat text. */
export function RarityBadge({ rarity }: { rarity: CardRarityDto }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold uppercase tracking-eyebrow ${RARITY_STYLES[rarity]}`}
    >
      {rarity}
    </span>
  );
}
