"use client";

import { AirplaneLanding, AirplaneTilt, IdentificationBadge } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AircraftCard } from "../cards/aircraft-card";
import { AirlineCard } from "../cards/airline-card";
import { AirportCard } from "../cards/airport-card";
import { ProgressRing } from "../feedback/progress-ring";
import { Chip } from "../ui/chip";
import type { CardAlbumResponse } from "../../lib/api-types";

type Filter = "ALL" | "AIRPORT" | "AIRCRAFT" | "AIRLINE";

export function CardAlbum({ album }: { album: CardAlbumResponse }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const router = useRouter();

  const airportsOwned = album.airports.filter((e) => e.owned).length;
  const aircraftOwned = album.aircraft.filter((e) => e.owned).length;
  const airlinesOwned = album.airlines.filter((e) => e.owned).length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
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

      {(filter === "ALL" || filter === "AIRPORT") && album.airports.length > 0 && (
        <AlbumSection title="Airports">
          {album.airports.map((entry) => (
            <AirportCard
              key={entry.card.iataCode}
              card={entry.card}
              owned={entry.owned}
              firstCollectedAtUtc={entry.firstCollectedAtUtc}
              onClick={() => router.push(`/cards/airport/${entry.card.iataCode}`)}
            />
          ))}
        </AlbumSection>
      )}

      {(filter === "ALL" || filter === "AIRCRAFT") && album.aircraft.length > 0 && (
        <AlbumSection title="Aircraft">
          {album.aircraft.map((entry) => (
            <AircraftCard
              key={entry.card.icaoTypeCode}
              card={entry.card}
              owned={entry.owned}
              firstCollectedAtUtc={entry.firstCollectedAtUtc}
              onClick={() => router.push(`/cards/aircraft/${entry.card.icaoTypeCode}`)}
            />
          ))}
        </AlbumSection>
      )}

      {(filter === "ALL" || filter === "AIRLINE") && album.airlines.length > 0 && (
        <AlbumSection title="Airlines">
          {album.airlines.map((entry) => (
            <AirlineCard
              key={entry.card.iataCode}
              card={entry.card}
              owned={entry.owned}
              firstCollectedAtUtc={entry.firstCollectedAtUtc}
              onClick={() => router.push(`/cards/airline/${entry.card.iataCode}`)}
            />
          ))}
        </AlbumSection>
      )}
    </div>
  );
}

function CompletenessStat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3">
      <ProgressRing value={value} total={total} size={44} />
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="font-mono text-xs text-text-primary">
          {value}/{total}
        </p>
      </div>
    </div>
  );
}

function AlbumSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl italic text-text-primary">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{children}</div>
    </section>
  );
}
