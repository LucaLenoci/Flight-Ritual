import { Card } from "../ui/card";
import { formatDistanceKm, formatDuration, formatShortDate } from "../../lib/format";
import type { FlightMemoryDto } from "../../lib/api-types";

export function MemoryCard({ memory }: { memory: FlightMemoryDto }) {
  const { snapshot } = memory;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-mist-400">{snapshot.flightNumber}</p>
          <p className="font-display text-lg text-mist-100">{snapshot.airlineName}</p>
        </div>
        <p className="text-xs text-mist-400">{formatShortDate(snapshot.departureDateUtc)}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 font-mono text-base text-mist-100">
        <span>{snapshot.originIataCode}</span>
        <span aria-hidden="true" className="text-mist-500">
          →
        </span>
        <span>{snapshot.destinationIataCode}</span>
      </div>

      <p className="mt-1 text-xs text-mist-400">
        {formatDistanceKm(snapshot.distanceKm)} · {formatDuration(snapshot.durationMinutes)}
        {snapshot.aircraftTypeModel ? ` · ${snapshot.aircraftTypeModel}` : ""}
      </p>

      {memory.note && <p className="mt-3 border-t border-ink-700/60 pt-3 text-sm italic text-mist-300">&ldquo;{memory.note}&rdquo;</p>}
    </Card>
  );
}
