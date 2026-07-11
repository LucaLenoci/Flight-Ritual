"use client";

import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import { ReactNode } from "react";
import type { CardRarityDto } from "../../lib/api-types";
import { MediaPlaceholder } from "./media-placeholder";
import { RarityBadge } from "../ui/rarity-badge";

const RARITY_BORDER: Record<CardRarityDto, string> = {
  COMMON: "border-rarity-common/40",
  UNCOMMON: "border-rarity-uncommon/60",
  RARE: "border-rarity-rare/70",
  LEGENDARY: "border-rarity-legendary/80",
};

const RARITY_GLOW: Record<CardRarityDto, string> = {
  COMMON: "",
  UNCOMMON: "shadow-glow-uncommon",
  RARE: "shadow-glow-rare",
  LEGENDARY: "shadow-glow-legendary",
};

export interface CardShellProps {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  code: string;
  title: string;
  subtitle: string;
  rarity: CardRarityDto;
  locked: boolean;
  mediaLabel: string;
  accentHex?: string;
  footer: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Shared internal shell for AirportCard/AircraftCard/AirlineCard. Physical
 * trading-card geometry (2.5:3.5, 22px radius) so it reads as an object,
 * not a data panel. Rarity is expressed structurally (border + glow, foil
 * sweep for legendary) — never a flat color swap on text alone. Locked
 * cards keep their full silhouette/shape — only the media is desaturated
 * and blurred, the code becomes "???", and the footer teases rather than
 * informs.
 */
export function CardShell({
  kind,
  code,
  title,
  subtitle,
  rarity,
  locked,
  mediaLabel,
  accentHex,
  footer,
  onClick,
  className = "",
}: CardShellProps) {
  const isLegendaryCollected = rarity === "LEGENDARY" && !locked;

  const content = (
    <div
      className={`group relative flex aspect-card w-full flex-col overflow-hidden rounded-card border-2 bg-surface-raised shadow-card transition-transform duration-ui ease-standard ${
        RARITY_BORDER[rarity]
      } ${locked ? "" : RARITY_GLOW[rarity]} ${onClick ? "cursor-pointer hover:-translate-y-1" : ""} ${className}`}
    >
      <div className="relative h-[46%] w-full shrink-0">
        <div className="h-full w-full" style={locked ? { filter: "blur(3px) grayscale(1)" } : undefined}>
          <MediaPlaceholder label={mediaLabel} accentHex={accentHex} className="h-full w-full" />
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
            <LockSimple weight="fill" size={28} className="text-white/90" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-pill bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-eyebrow text-white backdrop-blur-sm">
          {kind}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-medium uppercase text-text-secondary">
            {locked ? "???" : code}
          </span>
          <RarityBadge rarity={rarity} />
        </div>
        <p className="truncate font-display text-lg italic text-text-primary">{locked ? "Locked" : title}</p>
        <p className="truncate text-xs text-text-secondary">{locked ? "Not yet collected" : subtitle}</p>
        <div className="mt-auto border-t border-border pt-2 text-xs text-text-secondary">
          {locked ? "Fly this route to reveal" : footer}
        </div>
      </div>

      {isLegendaryCollected && (
        <div className="foil-sweep pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay" aria-hidden="true" />
      )}
    </div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-card text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      aria-label={locked ? `Locked ${kind.toLowerCase()} card` : `${title}, ${kind.toLowerCase()} card`}
    >
      {content}
    </button>
  );
}
