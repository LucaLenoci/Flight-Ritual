import { formatPhaseLabel } from "../../lib/format";
import type { FlightPhaseDto } from "../../lib/api-types";

const PHASE_STYLES: Record<FlightPhaseDto, string> = {
  SCHEDULED: "bg-paper-100 text-text-secondary dark:bg-surface-raised",
  BOARDING: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  DEPARTED: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  AIRBORNE: "bg-sky-500/20 text-sky-600 dark:text-sky-300",
  DESCENDING: "bg-amber-500/15 text-amber-500",
  LANDED: "bg-amber-500/20 text-amber-500",
  ARRIVED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/15 text-danger",
  DIVERTED: "bg-warning/15 text-warning",
};

export function PhaseBadge({ phase }: { phase: FlightPhaseDto }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium tracking-wide ${PHASE_STYLES[phase]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-current" />
      {formatPhaseLabel(phase)}
    </span>
  );
}
