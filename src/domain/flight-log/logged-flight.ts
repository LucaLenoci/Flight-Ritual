import { AircraftType } from "../aircraft/aircraft-type";
import { Airline } from "../airport/airline";
import { FlightNumber } from "../shared/flight-number";
import { LoggedFlightProvenance } from "./field-provenance";
import { Route } from "./route";

/**
 * A user's own record of a flight they took: the aggregate root of the new
 * Flight Log module, replacing the old live-tracked Flight. Identity is by
 * `id`, not by (flightNumber, date) — the same real-world flight can be
 * logged independently by many users, and a user's log is their own
 * permanent travel history, not a shared tracked resource.
 */
export class LoggedFlight {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly flightNumber: FlightNumber,
    readonly flightDate: Date,
    readonly airline: Airline,
    readonly route: Route,
    readonly aircraftType: AircraftType | null,
    readonly tailNumber: string | null,
    readonly note: string | null,
    readonly provenance: LoggedFlightProvenance,
    readonly createdAt: Date,
  ) {}

  distanceKm(): number {
    return this.route.distanceKm();
  }
}
