"use client";

import { Cards } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceKm, formatDuration, pluralize } from "../../lib/format";
import { CardAlbum } from "./card-album";
import { MemoryCard } from "./memory-card";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatTile } from "../ui/stat-tile";
import type { CardAlbumResponse, LegacyDashboardResponse } from "../../lib/api-types";

export function LegacyDashboard() {
  const [data, setData] = useState<LegacyDashboardResponse | null>(null);
  const [album, setAlbum] = useState<CardAlbumResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOne<T>(url: string): Promise<T> {
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't load your Flight Legacy");
      return body as T;
    }

    Promise.all([loadOne<LegacyDashboardResponse>("/api/legacy"), loadOne<CardAlbumResponse>("/api/cards")])
      .then(([legacy, cards]) => {
        if (cancelled) return;
        setData(legacy);
        setAlbum(cards);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-danger sm:px-6">{error}</p>;
  }

  if (!data || !album) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (data.memories.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl italic text-text-primary">My Flight Legacy</h1>
        <div className="mt-8">
          <EmptyState
            icon={<Cards aria-hidden="true" />}
            title="Your collection starts with your first landing"
            description="Once a tracked flight arrives, add it to your Legacy to unlock Airport, Aircraft, and Airline cards for everywhere you've flown."
            action={
              <Link href="/">
                <Button>Track a flight</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const { stats, memories } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">My Flight Legacy</h1>
      <p className="mt-1 text-sm text-text-secondary">{pluralize(stats.totalFlights, "flight")} saved</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Distance flown" value={formatDistanceKm(stats.totalDistanceKm)} />
        <StatTile label="Time in the air" value={formatDuration(stats.totalFlightMinutes)} />
        <StatTile label="Airports" value={String(stats.uniqueAirportCount)} />
        <StatTile label="Countries" value={String(stats.uniqueCountryCount)} />
      </div>

      {(stats.longestFlight || stats.mostFrequentRoute) && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stats.longestFlight && (
            <StatTile
              label="Longest flight"
              value={stats.longestFlight.flightNumber}
              hint={formatDistanceKm(stats.longestFlight.distanceKm)}
            />
          )}
          {stats.mostFrequentRoute && (
            <StatTile
              label="Most flown route"
              value={stats.mostFrequentRoute.routeKey}
              hint={pluralize(stats.mostFrequentRoute.flightCount, "flight")}
            />
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-xl italic text-text-primary">My Collection</h2>
        <CardAlbum album={album} />
      </div>

      <h2 className="mt-10 font-display text-xl italic text-text-primary">Saved Flights</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {memories.map((memory) => (
          <MemoryCard key={memory.id} memory={memory} />
        ))}
      </div>
    </div>
  );
}
