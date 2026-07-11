"use client";

import { useState } from "react";
import type { AircraftCardDto, AirlineCardDto, AirportCardDto, CardUnlockResultDto } from "../../lib/api-types";
import { Button } from "../ui/button";
import { AircraftCard } from "./aircraft-card";
import { AirlineCard } from "./airline-card";
import { AirportCard } from "./airport-card";

type QueueItem =
  | { kind: "AIRPORT"; card: AirportCardDto }
  | { kind: "AIRCRAFT"; card: AircraftCardDto }
  | { kind: "AIRLINE"; card: AirlineCardDto };

function buildQueue(result: CardUnlockResultDto): QueueItem[] {
  return [
    ...result.newAirportCards.map((card): QueueItem => ({ kind: "AIRPORT", card })),
    ...result.newAircraftCards.map((card): QueueItem => ({ kind: "AIRCRAFT", card })),
    ...result.newAirlineCards.map((card): QueueItem => ({ kind: "AIRLINE", card })),
  ];
}

/**
 * Pack-opening style reveal: one new card at a time, card-pop-in spring
 * animation per the motion spec (this is exactly the kind of "moment"
 * screen the brief reserves spring/bounce for). Skippable at any point —
 * emotional moments must never trap the user.
 */
export function CardRevealSequence({
  result,
  onDone,
}: {
  result: CardUnlockResultDto | null;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const queue = result ? buildQueue(result) : [];

  if (!result || queue.length === 0) return null;

  const current = queue[index]!;
  const isLast = index === queue.length - 1;

  function advance() {
    if (isLast) {
      setIndex(0);
      onDone();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New cards unlocked"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-golden-hour px-4"
    >
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          onDone();
        }}
        className="absolute right-5 top-5 rounded-pill border border-white/40 px-3 py-1.5 text-sm text-white transition-all duration-ui ease-standard hover:brightness-[1.06] active:scale-[0.97]"
      >
        Skip
      </button>

      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-eyebrow text-white/90">
        New {current.kind.toLowerCase()} unlocked · {index + 1} of {queue.length}
      </p>

      {/* key forces remount per card so card-pop-in replays for each reveal */}
      <div key={index} className="animate-card-pop-in w-full max-w-[280px]">
        {current.kind === "AIRPORT" && <AirportCard card={current.card} owned firstCollectedAtUtc={null} />}
        {current.kind === "AIRCRAFT" && <AircraftCard card={current.card} owned firstCollectedAtUtc={null} />}
        {current.kind === "AIRLINE" && <AirlineCard card={current.card} owned firstCollectedAtUtc={null} />}
      </div>

      <Button variant="secondary" onClick={advance} className="mt-8">
        {isLast ? "Done" : "Next Card"}
      </Button>
    </div>
  );
}
