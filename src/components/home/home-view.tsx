"use client";

import { AirplaneTilt, Cards, PlusCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FlightLogResponse, LoggedFlightDto, StatsSnapshotDto } from "../../lib/api-types";
import { formatDistanceKm, pluralize } from "../../lib/format";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatTile } from "../ui/stat-tile";

export function HomeView() {
  const [stats, setStats] = useState<StatsSnapshotDto | null>(null);
  const [recentFlights, setRecentFlights] = useState<LoggedFlightDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stats").then((res) => res.json()),
      fetch("/api/flight-log").then((res) => res.json()),
    ])
      .then(([statsBody, flightLogBody]: [StatsSnapshotDto, FlightLogResponse]) => {
        if (cancelled) return;
        setStats(statsBody);
        setRecentFlights(flightLogBody.flights.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null);
          setRecentFlights([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="animate-rise-fade mb-8 rounded-3xl bg-gradient-sky-day px-6 py-10 sm:px-10">
        <p className="font-mono text-xs uppercase tracking-eyebrow text-on-gradient/80">Aloft</p>
        <h1 className="mt-2 font-display text-3xl italic text-on-gradient sm:text-4xl">Your flight-life collection</h1>
        <p className="mt-2 max-w-xl text-sm text-on-gradient/90">
          Log the flights you&apos;ve taken and turn them into a personal collection of Airport, Aircraft, and Airline
          cards — plus stats and curiosities about everywhere you&apos;ve been.
        </p>
        <Link href="/add-flight" className="mt-5 inline-block">
          <Button variant="gradient">
            <PlusCircle aria-hidden="true" />
            Log a Flight
          </Button>
        </Link>
      </div>

      {!stats || !recentFlights ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : stats.totalFlights === 0 ? (
        <EmptyState
          icon={<AirplaneTilt aria-hidden="true" />}
          title="Nothing logged yet"
          description="Add your first flight to start unlocking Airport, Aircraft, and Airline cards."
          action={
            <Link href="/add-flight">
              <Button>Log a flight</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Flights logged" value={String(stats.totalFlights)} />
            <StatTile label="Distance flown" value={formatDistanceKm(stats.totalDistanceKm)} />
            <StatTile label="Airports" value={String(stats.uniqueAirportCount)} />
            <StatTile label="Countries" value={String(stats.uniqueCountryCount)} />
          </div>

          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-display text-xl italic text-text-primary">Recent flights</h2>
            <Link href="/flight-log" className="text-sm text-sky-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {recentFlights.map((flight) => (
              <div key={flight.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="font-mono text-xs text-text-secondary">{flight.flightNumber}</p>
                <p className="mt-1 font-mono text-sm text-text-primary">
                  {flight.origin.iataCode} → {flight.destination.iataCode}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">{flight.airline.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-display text-xl italic text-text-primary">Your collection</h2>
            <Link href="/collection" className="text-sm text-sky-600 hover:underline">
              <span className="inline-flex items-center gap-1">
                <Cards aria-hidden="true" />
                {pluralize(stats.uniqueAirportCount + stats.uniqueAirlineCount + stats.uniqueAircraftTypeCount, "card")} collected
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
