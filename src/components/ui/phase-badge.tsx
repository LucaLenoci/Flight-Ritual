import { formatPhaseLabel } from "../../lib/format";
import type { FlightPhaseDto } from "../../lib/api-types";

const PHASE_STYLES: Record<FlightPhaseDto, string> = {
  SCHEDULED: "bg-ink-700 text-mist-300",
  BOARDING: "bg-altitude-500/15 text-altitude-400",
  DEPARTED: "bg-altitude-500/15 text-altitude-400",
  AIRBORNE: "bg-altitude-500/20 text-altitude-400",
  DESCENDING: "bg-runway-500/15 text-runway-400",
  LANDED: "bg-runway-500/20 text-runway-400",
  ARRIVED: "bg-signal-success/15 text-signal-success",
  CANCELLED: "bg-signal-danger/15 text-signal-danger",
  DIVERTED: "bg-signal-warning/15 text-signal-warning",
};

export function PhaseBadge({ phase }: { phase: FlightPhaseDto }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${PHASE_STYLES[phase]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatPhaseLabel(phase)}
    </span>
  );
}
