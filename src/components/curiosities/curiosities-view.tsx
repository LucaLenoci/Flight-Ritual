"use client";

import { AirplaneTilt, Buildings, MapPinArea, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserCuriositiesDto } from "../../lib/api-types";
import { pluralize } from "../../lib/format";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";

const FACT_ICON = {
  AIRPORT: MapPinArea,
  AIRCRAFT: AirplaneTilt,
  AIRLINE: Buildings,
} as const;

export function CuriositiesView() {
  const [curiosities, setCuriosities] = useState<UserCuriositiesDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/curiosities")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your curiosities");
        if (!cancelled) setCuriosities(body as UserCuriositiesDto);
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

  if (!curiosities) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (curiosities.facts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl italic text-text-primary">Curiosities</h1>
        <div className="mt-8">
          <EmptyState
            icon={<Sparkle aria-hidden="true" />}
            title="Nothing to discover yet"
            description="Log a flight and Aloft will surface facts about the places and aircraft you've collected."
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">Curiosities</h1>
      <p className="mt-1 text-sm text-text-secondary">Did you know?</p>

      {curiosities.nextMilestone && (
        <div className="animate-rise-fade mt-6 rounded-2xl bg-gradient-golden-hour p-4 text-on-gradient shadow-ui">
          <p className="text-xs font-semibold uppercase tracking-eyebrow text-on-gradient/85">Milestone</p>
          <p className="mt-1 font-display text-lg italic">
            You&apos;ve reached {pluralize(curiosities.countryCount, "country", "countries")}
          </p>
          <p className="mt-1 text-sm text-on-gradient/90">
            {pluralize(curiosities.nextMilestone.countriesRemaining, "more country", "more countries")} to unlock the
            &ldquo;{curiosities.nextMilestone.name}&rdquo; milestone card.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {curiosities.facts.map((fact) => {
          const Icon = FACT_ICON[fact.kind];
          return (
            <div
              key={fact.kind}
              className="flex gap-3 rounded-xl border border-border bg-surface p-4 shadow-ui"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-sky-500 text-white">
                <Icon weight="fill" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-eyebrow text-sky-600">{fact.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-text-primary">{fact.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
