"use client";

import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import type { CardUnlockResultDto } from "../../lib/api-types";
import { Button } from "../ui/button";

export function SaveToLegacyButton({
  flightId,
  onSaved,
}: {
  flightId: string;
  onSaved?: (cardUnlocks: CardUnlockResultDto) => void;
}) {
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
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Couldn't save this flight");

      setStatus("saved");
      if (body.cardUnlocks) onSaved?.(body.cardUnlocks as CardUnlockResultDto);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Couldn't save this flight");
    }
  }

  if (status === "saved") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        <CheckCircle weight="fill" aria-hidden="true" />
        Saved to your Flight Legacy
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <label htmlFor="legacy-note" className="text-xs text-text-secondary">
        Add a note (optional)
      </label>
      <input
        id="legacy-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="e.g. First time in business class"
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-sky-500 focus:outline-none"
      />
      <Button onClick={handleSave} disabled={status === "saving"} className="mt-3 w-full">
        {status === "saving" ? "Saving…" : "Add to Legacy"}
      </Button>
      {status === "error" && errorMessage && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
