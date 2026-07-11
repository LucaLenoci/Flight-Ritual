"use client";

import { AirplaneLanding, AirplaneTilt, IdentificationBadge } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AircraftCard } from "../cards/aircraft-card";
import { AirlineCard } from "../cards/airline-card";
import { AirportCard } from "../cards/airport-card";
import { ProgressRing } from "../feedback/progress-ring";
import { Chip } from "../ui/chip";
import type { AlbumEntryDto, CardAlbumResponse } from "../../lib/api-types";

type Filter = "ALL" | "AIRPORT" | "AIRCRAFT" | "AIRLINE";

// The reference catalog is bulk-seeded from open data and can run into the
// thousands (e.g. airports) — rendering every locked silhouette would bloat
// the DOM for no real benefit (a locked card conveys nothing individually
// worth distinguishing at that scale). Every owned card always renders in
// full; locked cards are capped as a teaser, with a count of how many more
// remain to discover.
const LOCKED_CARD_DISPLAY_CAP = 24;

function visibleEntries<TCard>(entries: AlbumEntryDto<TCard>[]): {
  visible: AlbumEntryDto<TCard>[];
  remainingLockedCount: number;
} {
  const owned = entries.filter((e) => e.owned);
  const locked = entries.filter((e) => !e.owned);
  const visibleLocked = locked.slice(0, LOCKED_CARD_DISPLAY_CAP);
  return { visible: [...owned, ...visibleLocked], remainingLockedCount: locked.length - visibleLocked.length };
}

export function CollectionAlbum({ album }: { album: CardAlbumResponse }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const router = useRouter();

  const airportsOwned = album.airports.filter((e) => e.owned).length;
  const aircraftOwned = album.aircraft.filter((e) => e.owned).length;
  const airlinesOwned = album.airlines.filter((e) => e.owned).length;
  const totalOwned = airportsOwned + aircraftOwned + airlinesOwned;
  const totalCards = album.airports.length + album.aircraft.length + album.airlines.length;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <ProgressRing value={totalOwned} total={totalCards} size={56} />
        <div>
          <p className="font-display text-lg italic text-text-primary">
            {totalOwned} of {totalCards} cards
          </p>
          <p className="text-xs text-text-secondary">Keep logging flights to fill your album.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <CompletenessStat label="Airports" value={airportsOwned} total={album.airports.length} />
        <CompletenessStat label="Aircraft" value={aircraftOwned} total={album.aircraft.length} />
        <CompletenessStat label="Airlines" value={airlinesOwned} total={album.airlines.length} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          All Cards
        </Chip>
        <Chip active={filter === "AIRPORT"} icon={<AirplaneLanding aria-hidden="true" />} onClick={() => setFilter("AIRPORT")}>
          Airports
        </Chip>
        <Chip active={filter === "AIRCRAFT"} icon={<AirplaneTilt aria-hidden="true" />} onClick={() => setFilter("AIRCRAFT")}>
          Aircraft
        </Chip>
        <Chip
          active={filter === "AIRLINE"}
          icon={<IdentificationBadge aria-hidden="true" />}
          onClick={() => setFilter("AIRLINE")}
        >
          Airlines
        </Chip>
      </div>

      {(filter === "ALL" || filter === "AIRPORT") && album.airports.length > 0 && (() => {
        const { visible, remainingLockedCount } = visibleEntries(album.airports);
        return (
          <AlbumSection title="Airports" remainingLockedCount={remainingLockedCount}>
            {visible.map((entry) => (
              <AirportCard
                key={entry.card.iataCode}
                card={entry.card}
                owned={entry.owned}
                firstCollectedAtUtc={entry.firstCollectedAtUtc}
                onClick={() => router.push(`/cards/airport/${entry.card.iataCode}`)}
              />
            ))}
          </AlbumSection>
        );
      })()}

      {(filter === "ALL" || filter === "AIRCRAFT") && album.aircraft.length > 0 && (() => {
        const { visible, remainingLockedCount } = visibleEntries(album.aircraft);
        return (
          <AlbumSection title="Aircraft" remainingLockedCount={remainingLockedCount}>
            {visible.map((entry) => (
              <AircraftCard
                key={entry.card.icaoTypeCode}
                card={entry.card}
                owned={entry.owned}
                firstCollectedAtUtc={entry.firstCollectedAtUtc}
                onClick={() => router.push(`/cards/aircraft/${entry.card.icaoTypeCode}`)}
              />
            ))}
          </AlbumSection>
        );
      })()}

      {(filter === "ALL" || filter === "AIRLINE") && album.airlines.length > 0 && (() => {
        const { visible, remainingLockedCount } = visibleEntries(album.airlines);
        return (
          <AlbumSection title="Airlines" remainingLockedCount={remainingLockedCount}>
            {visible.map((entry) => (
              <AirlineCard
                key={entry.card.iataCode}
                card={entry.card}
                owned={entry.owned}
                firstCollectedAtUtc={entry.firstCollectedAtUtc}
                onClick={() => router.push(`/cards/airline/${entry.card.iataCode}`)}
              />
            ))}
          </AlbumSection>
        );
      })()}
    </div>
  );
}

function CompletenessStat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3">
      <ProgressRing value={value} total={total} size={40} />
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="font-mono text-xs text-text-primary">
          {value}/{total}
        </p>
      </div>
    </div>
  );
}

function AlbumSection({
  title,
  remainingLockedCount,
  children,
}: {
  title: string;
  remainingLockedCount: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl italic text-text-primary">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{children}</div>
      {remainingLockedCount > 0 && (
        <p className="mt-4 text-center text-xs text-text-secondary">
          + {remainingLockedCount.toLocaleString("en-US")} more to discover — keep logging flights.
        </p>
      )}
    </section>
  );
}
