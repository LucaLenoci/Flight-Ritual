"use client";

import { useState } from "react";

export function SaveToLegacyButton({ flightId }: { flightId: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/legacy/${flightId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || null }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't save this flight");
      }
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Couldn't save this flight");
    }
  }

  if (status === "saved") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-signal-success/30 bg-signal-success/10 px-4 py-3 text-sm text-signal-success">
        <span aria-hidden="true">✓</span>
        Saved to your Flight Legacy
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
      <label htmlFor="legacy-note" className="text-xs text-mist-400">
        Add a note (optional)
      </label>
      <input
        id="legacy-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="e.g. First time in business class"
        className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 placeholder:text-mist-500 focus:border-altitude-500 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={status === "saving"}
        className="mt-3 w-full rounded-full bg-altitude-500 px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-altitude-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-altitude-400"
      >
        {status === "saving" ? "Saving…" : "Save to Flight Legacy"}
      </button>
      {status === "error" && errorMessage && (
        <p role="alert" className="mt-2 text-xs text-signal-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
