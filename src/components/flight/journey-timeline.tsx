import {
  AirplaneInFlight,
  AirplaneLanding,
  AirplaneTakeoff,
  ArrowBendDownRight,
  ArrowRight,
  Circle,
  ClockCountdown,
  DoorOpen,
  FlagCheckered,
  MapPin,
  UsersThree,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { IconWeight } from "@phosphor-icons/react/lib";
import type { ComponentType } from "react";
import { formatEventLabel, formatLocalTime } from "../../lib/format";
import type { FlightDto, JourneyEventDto } from "../../lib/api-types";

const ARRIVAL_SIDE_EVENTS = new Set(["DESCENT_STARTED", "LANDED", "ARRIVED_AT_GATE"]);

interface EventIconSpec {
  Icon: ComponentType<{ weight?: IconWeight; size?: number; "aria-hidden"?: boolean }>;
  weight: IconWeight;
}

const EVENT_ICON: Record<string, EventIconSpec> = {
  SCHEDULED: { Icon: Circle, weight: "regular" },
  GATE_ASSIGNED: { Icon: DoorOpen, weight: "regular" },
  GATE_CHANGED: { Icon: DoorOpen, weight: "regular" },
  DELAY_UPDATED: { Icon: ClockCountdown, weight: "regular" },
  BOARDING_STARTED: { Icon: UsersThree, weight: "regular" },
  DEPARTED: { Icon: ArrowRight, weight: "bold" },
  TAKEOFF: { Icon: AirplaneTakeoff, weight: "fill" },
  CRUISE_REACHED: { Icon: AirplaneInFlight, weight: "fill" },
  DESCENT_STARTED: { Icon: AirplaneLanding, weight: "fill" },
  LANDED: { Icon: MapPin, weight: "fill" },
  ARRIVED_AT_GATE: { Icon: FlagCheckered, weight: "fill" },
  CANCELLED: { Icon: XCircle, weight: "regular" },
  DIVERTED: { Icon: ArrowBendDownRight, weight: "bold" },
};

export function JourneyTimeline({ flight, events }: { flight: FlightDto; events: JourneyEventDto[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-text-secondary">No journey events recorded yet.</p>;
  }

  return (
    <ol className="relative ml-3 space-y-5 border-l border-border pl-6">
      {events.map((event, index) => {
        const timeZone = ARRIVAL_SIDE_EVENTS.has(event.type) ? flight.destination.timeZone : flight.origin.timeZone;
        const spec = EVENT_ICON[event.type] ?? { Icon: Circle, weight: "regular" as IconWeight };
        return (
          <li key={`${event.type}-${event.occurredAtUtc}-${index}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.95rem] flex h-5 w-5 items-center justify-center rounded-pill bg-surface-raised text-sky-500 ring-2 ring-bg"
            >
              <spec.Icon weight={spec.weight} size={12} aria-hidden />
            </span>
            <p className="text-sm text-text-primary">{formatEventLabel(event.type, event.detail)}</p>
            <p className="font-mono text-xs text-text-secondary">{formatLocalTime(event.occurredAtUtc, timeZone)} local</p>
          </li>
        );
      })}
    </ol>
  );
}
