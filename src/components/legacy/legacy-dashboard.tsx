"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceKm, formatDuration, pluralize } from "../../lib/format";
import { CollectionSection } from "./collection-section";
import { MemoryCard } from "./memory-card";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatTile } from "../ui/stat-tile";
import type { LegacyDashboardResponse } from "../../lib/api-types";

export function LegacyDashboard() {
  const [data, setData] = useState<LegacyDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/legacy")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your Flight Legacy");
        if (!cancelled) setData(body as LegacyDashboardResponse);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-signal-danger sm:px-6">{error}</p>;
  }

  if (!data) {
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
        <h1 className="font-display text-3xl text-mist-100">My Flight Legacy</h1>
        <div className="mt-8">
          <EmptyState
            icon="◆"
            title="Your legacy starts with your first landing"
            description="Once a tracked flight arrives, save it here to build your personal collection of airports, airlines, aircraft, and routes."
            action={
              <Link
                href="/"
                className="inline-block rounded-full bg-altitude-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-altitude-400"
              >
                Track a flight
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const { stats, collection, memories } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-mist-100">My Flight Legacy</h1>
      <p className="mt-1 text-sm text-mist-400">{pluralize(stats.totalFlights, "flight")} saved</p>

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

      <div className="mt-8 grid gap-6 rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5 sm:grid-cols-2">
        <CollectionSection title="Airports" items={collection.airportIataCodes} emptyLabel="None yet" />
        <CollectionSection title="Airlines" items={collection.airlineIataCodes} emptyLabel="None yet" />
        <CollectionSection title="Aircraft" items={collection.aircraftTypeIcaoCodes} emptyLabel="None yet" />
        <CollectionSection title="Routes" items={collection.routeKeys} emptyLabel="None yet" />
      </div>

      <h2 className="mt-10 font-display text-xl text-mist-100">Saved flights</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {memories.map((memory) => (
          <MemoryCard key={memory.id} memory={memory} />
        ))}
      </div>
    </div>
  );
}
