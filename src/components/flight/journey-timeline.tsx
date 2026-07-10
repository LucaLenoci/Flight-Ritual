import { formatEventLabel, formatLocalTime } from "../../lib/format";
import type { FlightDto, JourneyEventDto } from "../../lib/api-types";

const ARRIVAL_SIDE_EVENTS = new Set(["DESCENT_STARTED", "LANDED", "ARRIVED_AT_GATE"]);

const EVENT_ICON: Record<string, string> = {
  SCHEDULED: "○",
  GATE_ASSIGNED: "◇",
  GATE_CHANGED: "◇",
  DELAY_UPDATED: "△",
  BOARDING_STARTED: "◑",
  DEPARTED: "→",
  TAKEOFF: "✈",
  CRUISE_REACHED: "—",
  DESCENT_STARTED: "↘",
  LANDED: "●",
  ARRIVED_AT_GATE: "◆",
  CANCELLED: "✕",
  DIVERTED: "⤷",
};

export function JourneyTimeline({ flight, events }: { flight: FlightDto; events: JourneyEventDto[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-mist-400">No journey events recorded yet.</p>;
  }

  return (
    <ol className="relative ml-3 space-y-5 border-l border-ink-700 pl-6">
      {events.map((event, index) => {
        const timeZone = ARRIVAL_SIDE_EVENTS.has(event.type) ? flight.destination.timeZone : flight.origin.timeZone;
        return (
          <li key={`${event.type}-${event.occurredAtUtc}-${index}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.95rem] flex h-5 w-5 items-center justify-center rounded-full bg-ink-800 text-[10px] text-altitude-400 ring-2 ring-ink-950"
            >
              {EVENT_ICON[event.type] ?? "•"}
            </span>
            <p className="text-sm text-mist-100">{formatEventLabel(event.type, event.detail)}</p>
            <p className="font-mono text-xs text-mist-400">{formatLocalTime(event.occurredAtUtc, timeZone)} local</p>
          </li>
        );
      })}
    </ol>
  );
}
