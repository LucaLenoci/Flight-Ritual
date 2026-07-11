import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Card } from "../ui/card";
import { formatDistanceKm, formatDuration, formatShortDate } from "../../lib/format";
import type { FlightMemoryDto } from "../../lib/api-types";

export function MemoryCard({ memory }: { memory: FlightMemoryDto }) {
  const { snapshot } = memory;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-text-secondary">{snapshot.flightNumber}</p>
          <p className="font-display text-lg italic text-text-primary">{snapshot.airlineName}</p>
        </div>
        <p className="text-xs text-text-secondary">{formatShortDate(snapshot.departureDateUtc)}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 font-mono text-base text-text-primary">
        <span>{snapshot.originIataCode}</span>
        <ArrowRight className="text-text-secondary" aria-hidden="true" />
        <span>{snapshot.destinationIataCode}</span>
      </div>

      <p className="mt-1 text-xs text-text-secondary">
        {formatDistanceKm(snapshot.distanceKm)} · {formatDuration(snapshot.durationMinutes)}
        {snapshot.aircraftTypeModel ? ` · ${snapshot.aircraftTypeModel}` : ""}
      </p>

      {memory.note && (
        <p className="mt-3 border-t border-border pt-3 text-sm italic text-text-secondary">&ldquo;{memory.note}&rdquo;</p>
      )}
    </Card>
  );
}
