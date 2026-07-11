import { AirplaneTilt } from "@phosphor-icons/react/dist/ssr";
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
      <Card className="p-5 transition-all duration-ui ease-standard group-hover:border-sky-500/50 group-hover:brightness-[1.02] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-sky-500">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-text-secondary">{flight.flightNumber}</p>
            <p className="mt-0.5 font-display text-lg italic text-text-primary">{flight.airlineName}</p>
          </div>
          <PhaseBadge phase={flight.phase} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-xl text-text-primary">{flight.originIataCode}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-border to-sky-500/50" />
          <AirplaneTilt weight="fill" className="text-sky-500" aria-hidden="true" />
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-sky-500/50 to-border" />
          <span className="font-mono text-xl text-text-primary">{flight.destinationIataCode}</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
          <span>Departs {formatLocalTime(flight.scheduledDepartureUtc, flight.originTimeZone)} local</span>
          <span>
            {flight.gate ? `Gate ${flight.gate}` : "Gate TBD"}
            {flight.delayMinutes > 0 && <span className="ml-2 text-warning">+{flight.delayMinutes}m</span>}
          </span>
        </div>
      </Card>
    </Link>
  );
}
