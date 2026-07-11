"use client";

import { CheckCircle, MagnifyingGlass, Sparkle, Warning } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type {
  AircraftTypeDto,
  CardUnlockResultDto,
  EnrichmentPreviewDto,
  AirportDto,
  AirlineDto,
} from "../../lib/api-types";
import { Button } from "../ui/button";
import { ReferenceOption, ReferenceSearchField } from "./reference-search-field";

async function searchAirports(query: string): Promise<ReferenceOption[]> {
  const res = await fetch(`/api/reference/airports?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { airports: AirportDto[] };
  return body.airports.map((a) => ({ code: a.iataCode, label: `${a.iataCode} — ${a.city}, ${a.country}` }));
}

async function searchAirlines(query: string): Promise<ReferenceOption[]> {
  const res = await fetch(`/api/reference/airlines?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { airlines: AirlineDto[] };
  return body.airlines.map((a) => ({ code: a.iataCode, label: `${a.iataCode} — ${a.name}` }));
}

type Step = "input" | "review" | "saved";

export function AddFlightForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [preview, setPreview] = useState<EnrichmentPreviewDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [airline, setAirline] = useState<ReferenceOption | null>(null);
  const [origin, setOrigin] = useState<ReferenceOption | null>(null);
  const [destination, setDestination] = useState<ReferenceOption | null>(null);
  const [aircraftTypes, setAircraftTypes] = useState<AircraftTypeDto[]>([]);
  const [aircraftTypeCode, setAircraftTypeCode] = useState("");
  const [tailNumber, setTailNumber] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [unlockResult, setUnlockResult] = useState<CardUnlockResultDto | null>(null);

  useEffect(() => {
    fetch("/api/reference/aircraft-types")
      .then((res) => res.json())
      .then((body: { aircraftTypes: AircraftTypeDto[] }) => setAircraftTypes(body.aircraftTypes))
      .catch(() => setAircraftTypes([]));
  }, []);

  const lookUpFlight = useCallback(async () => {
    setError(null);
    setLookingUp(true);
    try {
      const res = await fetch("/api/flight-log/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber, flightDate: new Date(flightDate).toISOString() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't look up this flight");

      const enrichmentPreview = body as EnrichmentPreviewDto;
      setPreview(enrichmentPreview);
      if (enrichmentPreview.airline) {
        setAirline({ code: enrichmentPreview.airline.iataCode, label: `${enrichmentPreview.airline.iataCode} — ${enrichmentPreview.airline.name}` });
      }
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLookingUp(false);
    }
  }, [flightNumber, flightDate]);

  async function saveFlight() {
    if (!airline || !origin || !destination) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/flight-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber,
          flightDate: new Date(flightDate).toISOString(),
          airlineIataCode: airline.code,
          originIataCode: origin.code,
          destinationIataCode: destination.code,
          aircraftTypeIcaoCode: aircraftTypeCode || null,
          tailNumber: tailNumber.trim() || null,
          note: note.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't save this flight");

      setUnlockResult(body.cardUnlocks as CardUnlockResultDto);
      setStep("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (step === "saved" && unlockResult) {
    const newCardCount =
      unlockResult.newAirportCards.length + unlockResult.newAircraftCards.length + unlockResult.newAirlineCards.length;
    return (
      <div className="animate-rise-fade rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-gradient-golden-hour text-on-gradient">
          <Sparkle weight="fill" size={24} aria-hidden="true" />
        </div>
        <p className="mt-4 font-display text-2xl italic text-text-primary">Flight added to your log</p>
        <p className="mt-1 text-sm text-text-secondary">
          {newCardCount > 0 ? `You unlocked ${newCardCount} new ${newCardCount === 1 ? "card" : "cards"}.` : "No new cards this time — you already had these."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => router.push("/collection")}>View Collection</Button>
          <Button variant="ghost" onClick={() => router.push("/flight-log")}>
            View Flight Log
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="flightNumber" className="text-xs text-text-secondary">
              Flight number
            </label>
            <input
              id="flightNumber"
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder="e.g. AZ100"
              disabled={step === "review"}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-text-primary placeholder:font-sans placeholder:text-text-secondary focus:border-sky-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="flightDate" className="text-xs text-text-secondary">
              Date
            </label>
            <input
              id="flightDate"
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              disabled={step === "review"}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-sky-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {step === "input" && (
          <Button
            onClick={lookUpFlight}
            disabled={!flightNumber.trim() || !flightDate || lookingUp}
            className="mt-4 w-full"
          >
            <MagnifyingGlass aria-hidden="true" />
            {lookingUp ? "Looking up…" : "Look Up Flight"}
          </Button>
        )}
      </div>

      {step === "review" && preview && (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          {preview.airline ? (
            <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle weight="fill" aria-hidden="true" />
              We found the airline: {preview.airline.name}
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              <Warning weight="fill" aria-hidden="true" />
              We couldn&apos;t identify the airline automatically — please select it below.
            </p>
          )}

          <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            <Warning weight="fill" aria-hidden="true" />
            We couldn&apos;t automatically find your route for this date — tell us where you flew.
          </p>

          {!preview.airline && (
            <ReferenceSearchField
              id="airline"
              label="Airline"
              placeholder="Search airline…"
              search={searchAirlines}
              selected={airline}
              onSelect={setAirline}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReferenceSearchField
              id="origin"
              label="From"
              placeholder="Search departure airport…"
              search={searchAirports}
              selected={origin}
              onSelect={setOrigin}
            />
            <ReferenceSearchField
              id="destination"
              label="To"
              placeholder="Search arrival airport…"
              search={searchAirports}
              selected={destination}
              onSelect={setDestination}
            />
          </div>

          <div>
            <label htmlFor="aircraftType" className="text-xs text-text-secondary">
              Aircraft type (optional)
            </label>
            <select
              id="aircraftType"
              value={aircraftTypeCode}
              onChange={(e) => setAircraftTypeCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-sky-500 focus:outline-none"
            >
              <option value="">Not sure / skip</option>
              {aircraftTypes.map((type) => (
                <option key={type.icaoTypeCode} value={type.icaoTypeCode}>
                  {type.manufacturer} {type.model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tailNumber" className="text-xs text-text-secondary">
                Tail number (optional)
              </label>
              <input
                id="tailNumber"
                type="text"
                value={tailNumber}
                onChange={(e) => setTailNumber(e.target.value.toUpperCase())}
                placeholder="e.g. EI-DEA"
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-text-primary placeholder:font-sans placeholder:text-text-secondary focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="note" className="text-xs text-text-secondary">
                Note (optional)
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                placeholder="e.g. First time in business class"
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <Button onClick={saveFlight} disabled={!airline || !origin || !destination || saving} className="w-full">
            {saving ? "Adding…" : "Add to My Collection"}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
