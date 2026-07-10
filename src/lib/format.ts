export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatDistanceKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

export function formatLocalTime(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(
    new Date(isoUtc),
  );
}

export function formatLocalDateTime(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(isoUtc));
}

export function formatShortDate(isoUtc: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(isoUtc),
  );
}

const PHASE_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  BOARDING: "Boarding",
  DEPARTED: "Departed",
  AIRBORNE: "In the air",
  DESCENDING: "Descending",
  LANDED: "Landed",
  ARRIVED: "Arrived",
  CANCELLED: "Cancelled",
  DIVERTED: "Diverted",
};

export function formatPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase;
}

const EVENT_LABELS: Record<string, string> = {
  SCHEDULED: "Flight scheduled",
  GATE_ASSIGNED: "Gate assigned",
  GATE_CHANGED: "Gate changed",
  DELAY_UPDATED: "Delay updated",
  BOARDING_STARTED: "Boarding started",
  DEPARTED: "Pushed back from gate",
  TAKEOFF: "Wheels up",
  CRUISE_REACHED: "Reached cruising altitude",
  DESCENT_STARTED: "Began descent",
  LANDED: "Touched down",
  ARRIVED_AT_GATE: "Arrived at gate",
  CANCELLED: "Flight cancelled",
  DIVERTED: "Flight diverted",
};

export function formatEventLabel(type: string, detail: Record<string, unknown>): string {
  if (type === "GATE_ASSIGNED" || type === "GATE_CHANGED") {
    const gate = detail.gate;
    return typeof gate === "string" ? `${EVENT_LABELS[type]}: ${gate}` : (EVENT_LABELS[type] ?? type);
  }
  if (type === "DELAY_UPDATED") {
    const minutes = detail.delayMinutes;
    if (typeof minutes === "number" && minutes > 0) return `Delayed ${minutes} min`;
    return "On schedule";
  }
  return EVENT_LABELS[type] ?? type;
}
