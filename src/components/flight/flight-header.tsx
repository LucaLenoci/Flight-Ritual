import { PhaseBadge } from "../ui/phase-badge";
import { formatDistanceKm, formatDuration, formatLocalDateTime } from "../../lib/format";
import type { FlightDto } from "../../lib/api-types";

export function FlightHeader({ flight }: { flight: FlightDto }) {
  const durationMinutes =
    (new Date(flight.scheduledArrivalUtc).getTime() - new Date(flight.scheduledDepartureUtc).getTime()) / 60_000;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-sm text-text-secondary">{flight.flightNumber}</p>
        <PhaseBadge phase={flight.phase} />
        {flight.isDelayed && (
          <span className="rounded-pill bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
            Delayed {flight.delayMinutes} min
          </span>
        )}
      </div>

      <h1 className="mt-2 font-display text-3xl italic text-text-primary sm:text-4xl">{flight.airline.name}</h1>

      <div className="mt-5 flex flex-wrap items-end gap-4 sm:gap-8">
        <div>
          <p className="font-mono text-3xl text-text-primary">{flight.origin.iataCode}</p>
          <p className="text-sm text-text-secondary">{flight.origin.city}</p>
          <p className="mt-1 font-mono text-xs text-text-secondary">
            {formatLocalDateTime(flight.scheduledDepartureUtc, flight.origin.timeZone)}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1 pb-1 text-text-secondary">
          <span className="font-mono text-xs">{formatDuration(durationMinutes)}</span>
          <span aria-hidden="true" className="h-px w-full min-w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs">{formatDistanceKm(flight.distanceKm)}</span>
        </div>

        <div className="text-right">
          <p className="font-mono text-3xl text-text-primary">{flight.destination.iataCode}</p>
          <p className="text-sm text-text-secondary">{flight.destination.city}</p>
          <p className="mt-1 font-mono text-xs text-text-secondary">
            {formatLocalDateTime(flight.scheduledArrivalUtc, flight.destination.timeZone)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-text-secondary">{flight.gate ? `Gate ${flight.gate}` : "Gate not yet assigned"}</p>
    </div>
  );
}
