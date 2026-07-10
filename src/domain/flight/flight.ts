import { AircraftAssignment } from "../aircraft/aircraft-assignment";
import { Airline } from "../airport/airline";
import { FlightNumber } from "../shared/flight-number";
import { ZonedInstant } from "../shared/zoned-instant";
import { FlightPhase } from "./flight-phase";
import { Route } from "./route";

export class Flight {
  constructor(
    readonly id: string,
    readonly flightNumber: FlightNumber,
    readonly airline: Airline,
    readonly route: Route,
    readonly scheduledDeparture: ZonedInstant,
    readonly scheduledArrival: ZonedInstant,
    readonly phase: FlightPhase,
    readonly delayMinutes: number,
    readonly gate: string | null,
    readonly actualDeparture: ZonedInstant | null,
    readonly actualArrival: ZonedInstant | null,
    readonly aircraftAssignment: AircraftAssignment | null,
  ) {}

  isDelayed(): boolean {
    return this.delayMinutes > 0;
  }

  scheduledDurationMinutes(): number {
    return this.scheduledDeparture.minutesUntil(this.scheduledArrival);
  }

  /**
   * Fraction of the scheduled flight elapsed at a given instant, clamped to
   * [0, 1]. Used to interpolate the aircraft's position for the Golden Hour
   * engine when only actual departure (not real-time position) is known.
   */
  elapsedFractionAt(instantUtc: Date): number {
    const start = this.actualDeparture?.utcDate ?? this.scheduledDeparture.utcDate;
    const end = this.actualArrival?.utcDate ?? this.scheduledArrival.utcDate;
    const total = end.getTime() - start.getTime();
    if (total <= 0) return 0;
    const elapsed = instantUtc.getTime() - start.getTime();
    return Math.min(1, Math.max(0, elapsed / total));
  }

  /** Returns a copy of this flight with its aircraft assignment replaced — Flight is otherwise immutable. */
  withAircraftAssignment(aircraftAssignment: AircraftAssignment): Flight {
    return new Flight(
      this.id,
      this.flightNumber,
      this.airline,
      this.route,
      this.scheduledDeparture,
      this.scheduledArrival,
      this.phase,
      this.delayMinutes,
      this.gate,
      this.actualDeparture,
      this.actualArrival,
      aircraftAssignment,
    );
  }
}
