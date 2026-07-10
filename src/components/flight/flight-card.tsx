import Link from "next/link";
import { Card } from "../ui/card";
import { PhaseBadge } from "../ui/phase-badge";
import { formatLocalTime } from "../../lib/format";
import type { FlightPhaseDto } from "../../lib/api-types";

export interface FlightCardData {
  flightNumber: string;
  airlineName: string;
  originIataCode: string;
  originTimeZone: string;
  destinationIataCode: string;
  scheduledDepartureUtc: string;
  phase: FlightPhaseDto;
  gate: string | null;
  delayMinutes: number;
}

export function FlightCard({ flight }: { flight: FlightCardData }) {
  return (
    <Link
      href={`/flight/${flight.flightNumber}`}
      className="group block focus-visible:outline-none"
      aria-label={`View ${flight.flightNumber}, ${flight.originIataCode} to ${flight.destinationIataCode}`}
    >
      <Card className="p-5 transition-all duration-200 group-hover:border-altitude-500/50 group-hover:bg-ink-900 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-altitude-400">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-mist-400">{flight.flightNumber}</p>
            <p className="mt-0.5 font-display text-lg text-mist-100">{flight.airlineName}</p>
          </div>
          <PhaseBadge phase={flight.phase} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-xl text-mist-100">{flight.originIataCode}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-ink-600 to-altitude-500/50" />
          <span aria-hidden="true" className="text-altitude-400">
            ✈
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-altitude-500/50 to-ink-600" />
          <span className="font-mono text-xl text-mist-100">{flight.destinationIataCode}</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-mist-400">
          <span>Departs {formatLocalTime(flight.scheduledDepartureUtc, flight.originTimeZone)} local</span>
          <span>
            {flight.gate ? `Gate ${flight.gate}` : "Gate TBD"}
            {flight.delayMinutes > 0 && (
              <span className="ml-2 text-signal-warning">+{flight.delayMinutes}m</span>
            )}
          </span>
        </div>
      </Card>
    </Link>
  );
}
