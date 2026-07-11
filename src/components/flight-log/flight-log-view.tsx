"use client";

import { ArrowRight, Cards } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FlightLogResponse, LoggedFlightDto } from "../../lib/api-types";
import { formatShortDate, pluralize } from "../../lib/format";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";

export function FlightLogView() {
  const [flights, setFlights] = useState<LoggedFlightDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/flight-log")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your flight log");
        if (!cancelled) setFlights((body as FlightLogResponse).flights);
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

  if (!flights) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">Flight Log</h1>
      <p className="mt-1 text-sm text-text-secondary">{pluralize(flights.length, "flight")}, chronologically</p>

      {flights.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Cards aria-hidden="true" />}
            title="No flights logged yet"
            description="Add your first flight to start building your travel history."
            action={
              <Link href="/add-flight">
                <Button>Log a flight</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="relative mt-6">
          <div className="absolute bottom-5 left-[9px] top-1 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col gap-4">
            {flights.map((flight) => (
              <div key={flight.id} className="relative flex gap-4">
                <div
                  className={`z-10 mt-1.5 h-[18px] w-[18px] shrink-0 rounded-pill ${
                    flight.unlocks && flight.unlocks.length > 0 ? "bg-sky-500 ring-4 ring-sky-500/20" : "bg-border"
                  }`}
                />
                <div className="flex-1 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-mono text-base text-text-primary">
                      {flight.origin.iataCode}
                      <ArrowRight className="text-text-secondary" size={14} aria-hidden="true" />
                      {flight.destination.iataCode}
                    </span>
                    <span className="whitespace-nowrap text-xs text-text-secondary">{formatShortDate(flight.flightDate)}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-text-secondary">
                    {flight.flightNumber} · {flight.airline.name}
                    {flight.aircraftType ? ` · ${flight.aircraftType.model}` : ""}
                  </p>
                  {flight.note && <p className="mt-2 text-sm italic text-text-secondary">&ldquo;{flight.note}&rdquo;</p>}
                  {flight.unlocks && flight.unlocks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {flight.unlocks.map((unlock, index) => (
                        <span
                          key={`${unlock.kind}-${unlock.label}-${index}`}
                          className="rounded-pill bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300"
                        >
                          + {unlock.kind[0]}
                          {unlock.kind.slice(1).toLowerCase()}: {unlock.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
