"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StatsSnapshotDto } from "../../lib/api-types";
import { formatDistanceKm, formatShortDate, pluralize } from "../../lib/format";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatTile } from "../ui/stat-tile";

export function StatsView() {
  const [stats, setStats] = useState<StatsSnapshotDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your stats");
        if (!cancelled) setStats(body as StatsSnapshotDto);
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

  if (!stats) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (stats.totalFlights === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl italic text-text-primary">Stats &amp; Insights</h1>
        <div className="mt-8">
          <EmptyState
            title="No stats yet"
            description="Log your first flight and your travel statistics will appear here."
            action={
              <Link href="/add-flight">
                <Button>Log a flight</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">Stats &amp; Insights</h1>
      <p className="mt-1 text-sm text-text-secondary">{pluralize(stats.totalFlights, "flight")} logged</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total distance" value={formatDistanceKm(stats.totalDistanceKm)} />
        <StatTile label="Airports visited" value={String(stats.uniqueAirportCount)} />
        <StatTile label="Airlines flown" value={String(stats.uniqueAirlineCount)} />
        <StatTile label="Aircraft models" value={String(stats.uniqueAircraftTypeCount)} />
        <StatTile
          label="Countries reached"
          value={String(stats.uniqueCountryCount)}
          hint={stats.uniqueContinentCount > 0 ? `${pluralize(stats.uniqueContinentCount, "continent")}` : undefined}
        />
        {stats.longestFlight && (
          <StatTile
            label="Longest flight"
            value={stats.longestFlight.flightNumber}
            hint={formatDistanceKm(stats.longestFlight.distanceKm)}
          />
        )}
        {stats.mostFlownAirline && (
          <StatTile
            label="Most flown airline"
            value={stats.mostFlownAirline.name}
            hint={pluralize(stats.mostFlownAirline.flightCount, "flight")}
          />
        )}
        {stats.mostFlownAircraftType && (
          <StatTile
            label="Most flown aircraft"
            value={stats.mostFlownAircraftType.model}
            hint={pluralize(stats.mostFlownAircraftType.flightCount, "flight")}
          />
        )}
        {stats.mostVisitedAirport && (
          <StatTile
            label="Most visited airport"
            value={stats.mostVisitedAirport.iataCode}
            hint={`${pluralize(stats.mostVisitedAirport.visitCount, "visit")} — ${stats.mostVisitedAirport.city}`}
          />
        )}
        {stats.mostFrequentRoute && (
          <StatTile
            label="Most flown route"
            value={stats.mostFrequentRoute.routeKey}
            hint={pluralize(stats.mostFrequentRoute.flightCount, "flight")}
          />
        )}
        {stats.firstLoggedFlight && (
          <StatTile
            label="First flight logged"
            value={stats.firstLoggedFlight.flightNumber}
            hint={formatShortDate(stats.firstLoggedFlight.flightDate)}
          />
        )}
        {stats.latestLoggedFlight && (
          <StatTile
            label="Latest flight logged"
            value={stats.latestLoggedFlight.flightNumber}
            hint={formatShortDate(stats.latestLoggedFlight.flightDate)}
          />
        )}
      </div>

      {stats.topRoutes.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl italic text-text-primary">Most frequent routes</h2>
          <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
            {stats.topRoutes.map((route) => (
              <div key={route.routeKey}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-mono text-text-primary">{route.routeKey}</span>
                  <span className="text-xs text-text-secondary">
                    {pluralize(route.flightCount, "flight")} · {route.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-paper-100 dark:bg-surface-raised">
                  <div className="h-full rounded-pill bg-sky-500" style={{ width: `${route.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
