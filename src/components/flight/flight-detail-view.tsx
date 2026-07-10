"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AircraftRevealCard } from "../aircraft-reveal/aircraft-reveal-card";
import { GoldenHourPanel } from "../golden-hour/golden-hour-panel";
import { SaveToLegacyButton } from "../legacy/save-to-legacy-button";
import { RunwayMomentOverlay } from "../runway-moment/runway-moment-overlay";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { FlightHeader } from "./flight-header";
import { JourneyTimeline } from "./journey-timeline";
import type { FlightDetailResponse, RunwayMomentDto } from "../../lib/api-types";

const POLL_INTERVAL_MS = 20_000;

export function FlightDetailView({ flightNumber }: { flightNumber: string }) {
  const [data, setData] = useState<FlightDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMoment, setActiveMoment] = useState<RunwayMomentDto | null>(null);
  const isFirstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/flights/${encodeURIComponent(flightNumber)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Couldn't load this flight");

      setData(body as FlightDetailResponse);
      setError(null);
      if (body.runwayMoment) setActiveMoment(body.runwayMoment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      isFirstLoad.current = false;
    }
  }, [flightNumber]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="font-display text-2xl text-mist-100">Couldn&apos;t find that flight</p>
        <p className="mt-2 text-sm text-mist-400">{error}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-ink-600 px-4 py-2 text-sm text-mist-200 hover:bg-ink-800"
        >
          Back to journeys
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {data.degraded && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-signal-warning/30 bg-signal-warning/10 px-4 py-3 text-sm text-signal-warning"
        >
          Live updates are temporarily unavailable — showing the last known status.
        </div>
      )}

      <FlightHeader flight={data.flight} />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card className="p-6 sm:col-span-2">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-mist-400">Journey Timeline</p>
          <JourneyTimeline flight={data.flight} events={data.events} />
        </Card>

        <AircraftRevealCard assignment={data.flight.aircraftAssignment} />
        <GoldenHourPanel recommendation={data.goldenHour} flight={data.flight} />

        {data.flight.phase === "ARRIVED" && (
          <div className="sm:col-span-2">
            <SaveToLegacyButton flightId={data.flight.id} />
          </div>
        )}
      </div>

      <RunwayMomentOverlay moment={activeMoment} onDismiss={() => setActiveMoment(null)} />
    </div>
  );
}
