"use client";

import { CheckCircle, Plus, Trash, XCircle } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BulkSaveResponse, BulkSaveRowInput } from "../../lib/api-types";
import { Button } from "../ui/button";

interface DraftRow extends BulkSaveRowInput {
  key: string;
}

function emptyRow(): DraftRow {
  return {
    key: crypto.randomUUID(),
    flightNumber: "",
    flightDate: "",
    originIataCode: "",
    destinationIataCode: "",
    airlineIataCode: "",
    aircraftTypeIcaoCode: null,
    tailNumber: null,
    note: null,
  };
}

/**
 * Power-user bulk entry: plain IATA/ICAO code fields per row rather than
 * typeahead, so pasting in a dozen past flights at once stays fast. Every
 * row still runs through the same server-side validation and card-unlock
 * evaluation as a single flight save — this is a faster input path, not a
 * lower-trust one.
 */
export function BulkImportForm() {
  const router = useRouter();
  const [rows, setRows] = useState<DraftRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkSaveResponse | null>(null);

  function updateRow(key: string, field: keyof BulkSaveRowInput, value: string) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value || null } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  async function submit() {
    setError(null);
    const filled = rows.filter(
      (row) => row.flightNumber.trim() && row.flightDate && row.originIataCode.trim() && row.destinationIataCode.trim() && row.airlineIataCode.trim(),
    );
    if (filled.length === 0) {
      setError("Fill in at least one complete row (flight number, date, from, to, airline).");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/flight-log/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flights: filled.map((row) => ({
            flightNumber: row.flightNumber.trim().toUpperCase(),
            flightDate: new Date(row.flightDate).toISOString(),
            originIataCode: row.originIataCode.trim().toUpperCase(),
            destinationIataCode: row.destinationIataCode.trim().toUpperCase(),
            airlineIataCode: row.airlineIataCode.trim().toUpperCase(),
            aircraftTypeIcaoCode: row.aircraftTypeIcaoCode?.trim().toUpperCase() || null,
            tailNumber: row.tailNumber?.trim().toUpperCase() || null,
            note: row.note?.trim() || null,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Couldn't import these flights");
      setResult(body as BulkSaveResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const successCount = result.results.filter((r) => r.success).length;
    const newCardCount = result.results.reduce(
      (sum, r) =>
        sum +
        (r.cardUnlocks
          ? r.cardUnlocks.newAirportCards.length + r.cardUnlocks.newAircraftCards.length + r.cardUnlocks.newAirlineCards.length
          : 0),
      0,
    );
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 text-center">
          <p className="font-display text-2xl italic text-text-primary">
            {successCount} of {result.results.length} flights imported
          </p>
          {newCardCount > 0 && (
            <p className="mt-1 text-sm text-text-secondary">
              You unlocked {newCardCount} new {newCardCount === 1 ? "card" : "cards"}.
            </p>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => router.push("/flight-log")}>View Flight Log</Button>
            <Button variant="ghost" onClick={() => router.push("/collection")}>
              View Collection
            </Button>
          </div>
        </div>

        {result.results.some((r) => !r.success) && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-text-primary">Rows that couldn&apos;t be saved</p>
            <ul className="mt-2 space-y-1.5">
              {result.results
                .filter((r) => !r.success)
                .map((r) => (
                  <li key={r.index} className="flex items-start gap-2 text-xs text-danger">
                    <XCircle className="mt-0.5 shrink-0" weight="fill" aria-hidden="true" />
                    Row {r.index + 1}: {r.error}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-4">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-text-secondary">
              <th className="px-2 pb-2">Flight #</th>
              <th className="px-2 pb-2">Date</th>
              <th className="px-2 pb-2">From</th>
              <th className="px-2 pb-2">To</th>
              <th className="px-2 pb-2">Airline</th>
              <th className="px-2 pb-2">Aircraft (ICAO)</th>
              <th className="px-2 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="p-1">
                  <RowInput value={row.flightNumber} onChange={(v) => updateRow(row.key, "flightNumber", v)} placeholder="AZ100" mono />
                </td>
                <td className="p-1">
                  <input
                    type="date"
                    value={row.flightDate}
                    onChange={(e) => updateRow(row.key, "flightDate", e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text-primary focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="p-1">
                  <RowInput value={row.originIataCode} onChange={(v) => updateRow(row.key, "originIataCode", v)} placeholder="BRI" mono />
                </td>
                <td className="p-1">
                  <RowInput
                    value={row.destinationIataCode}
                    onChange={(v) => updateRow(row.key, "destinationIataCode", v)}
                    placeholder="MXP"
                    mono
                  />
                </td>
                <td className="p-1">
                  <RowInput value={row.airlineIataCode} onChange={(v) => updateRow(row.key, "airlineIataCode", v)} placeholder="AZ" mono />
                </td>
                <td className="p-1">
                  <RowInput
                    value={row.aircraftTypeIcaoCode ?? ""}
                    onChange={(v) => updateRow(row.key, "aircraftTypeIcaoCode", v)}
                    placeholder="A20N"
                    mono
                  />
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove row"
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="ghost" onClick={addRow}>
        <Plus aria-hidden="true" />
        Add row
      </Button>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button onClick={submit} disabled={submitting} className="w-full">
        <CheckCircle aria-hidden="true" />
        {submitting ? "Importing…" : "Import Flights"}
      </Button>
    </div>
  );
}

function RowInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-sky-500 focus:outline-none ${mono ? "font-mono" : ""}`}
    />
  );
}
