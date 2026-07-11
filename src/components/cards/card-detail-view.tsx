"use client";

import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatShortDate } from "../../lib/format";
import type { CardAlbumResponse } from "../../lib/api-types";
import { AircraftCard } from "./aircraft-card";
import { AirlineCard } from "./airline-card";
import { AirportCard } from "./airport-card";
import { CardBackDetail } from "./card-back-detail";
import { CardFlipper } from "./card-flipper";
import { Skeleton } from "../ui/skeleton";

const VALID_KINDS = new Set(["airport", "aircraft", "airline"]);

export function CardDetailView({ kind, code }: { kind: string; code: string }) {
  const [album, setAlbum] = useState<CardAlbumResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cards")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load this card");
        if (!cancelled) setAlbum(body as CardAlbumResponse);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!VALID_KINDS.has(kind)) {
    return <NotFound />;
  }

  if (error) {
    return <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-danger">{error}</p>;
  }

  if (!album) {
    return (
      <div className="mx-auto max-w-xs px-4 py-10">
        <Skeleton className="aspect-card w-full" />
      </div>
    );
  }

  if (kind === "airport") {
    const entry = album.airports.find((e) => e.card.iataCode === code);
    if (!entry) return <NotFound />;
    return (
      <DetailShell backHref="/collection">
        {entry.owned ? (
          <CardFlipper
            front={<AirportCard card={entry.card} owned firstCollectedAtUtc={entry.firstCollectedAtUtc} />}
            back={
              <CardBackDetail
                kind="AIRPORT"
                title={entry.card.city}
                rarity={entry.card.rarity}
                rows={[
                  { label: "IATA", value: entry.card.iataCode },
                  { label: "ICAO", value: entry.card.icaoCode },
                  { label: "Country", value: entry.card.country },
                ]}
                firstCollectedLabel={
                  entry.firstCollectedAtUtc ? `Collected ${formatShortDate(entry.firstCollectedAtUtc)}` : null
                }
              />
            }
          />
        ) : (
          <AirportCard card={entry.card} owned={false} firstCollectedAtUtc={null} />
        )}
      </DetailShell>
    );
  }

  if (kind === "aircraft") {
    const entry = album.aircraft.find((e) => e.card.icaoTypeCode === code);
    if (!entry) return <NotFound />;
    return (
      <DetailShell backHref="/collection">
        {entry.owned ? (
          <CardFlipper
            front={<AircraftCard card={entry.card} owned firstCollectedAtUtc={entry.firstCollectedAtUtc} />}
            back={
              <CardBackDetail
                kind="AIRCRAFT"
                title={entry.card.model}
                rarity={entry.card.rarity}
                rows={[
                  { label: "Manufacturer", value: entry.card.manufacturer },
                  { label: "Model", value: entry.card.icaoTypeCode },
                  { label: "Engine", value: entry.card.engineType },
                ]}
                funFact={entry.card.funFact}
                firstCollectedLabel={
                  entry.firstCollectedAtUtc ? `Collected ${formatShortDate(entry.firstCollectedAtUtc)}` : null
                }
              />
            }
          />
        ) : (
          <AircraftCard card={entry.card} owned={false} firstCollectedAtUtc={null} />
        )}
      </DetailShell>
    );
  }

  const entry = album.airlines.find((e) => e.card.iataCode === code);
  if (!entry) return <NotFound />;
  return (
    <DetailShell backHref="/collection">
      {entry.owned ? (
        <CardFlipper
          front={<AirlineCard card={entry.card} owned firstCollectedAtUtc={entry.firstCollectedAtUtc} />}
          back={
            <CardBackDetail
              kind="AIRLINE"
              title={entry.card.name}
              rarity={entry.card.rarity}
              rows={[
                { label: "IATA", value: entry.card.iataCode },
                { label: "ICAO", value: entry.card.icaoDesignator },
                { label: "Country", value: entry.card.country },
              ]}
              funFact={entry.card.funFact}
              firstCollectedLabel={
                entry.firstCollectedAtUtc ? `Collected ${formatShortDate(entry.firstCollectedAtUtc)}` : null
              }
            />
          }
        />
      ) : (
        <AirlineCard card={entry.card} owned={false} firstCollectedAtUtc={null} />
      )}
    </DetailShell>
  );
}

function DetailShell({ children, backHref }: { children: React.ReactNode; backHref: string }) {
  return (
    <div className="mx-auto max-w-xs px-4 py-10">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft aria-hidden="true" />
        Back to Collection
      </Link>
      {children}
      <p className="mt-4 text-center text-xs text-text-secondary">Tap the card to flip it</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-display text-2xl italic text-text-primary">Card not found</p>
      <Link href="/collection" className="mt-4 inline-block text-sm text-sky-600 hover:underline">
        Back to My Collection
      </Link>
    </div>
  );
}
