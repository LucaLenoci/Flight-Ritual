import { Flight } from "../../domain/flight/flight";
import { JourneyEvent } from "../../domain/flight/journey-event";

export interface FlightRepository {
  findByFlightNumberAndDeparture(flightNumber: string, scheduledDepartureUtc: Date): Promise<Flight | null>;
  findById(flightId: string): Promise<Flight | null>;
  save(flight: Flight): Promise<void>;

  /**
   * Inserts the event only if no event with the same idempotency key exists
   * for this flight. Returns whether it was newly inserted — callers use
   * this to decide whether a Runway Moment or notification should fire, so
   * re-processing the same provider payload never re-triggers one.
   */
  appendJourneyEventIfNew(event: JourneyEvent): Promise<boolean>;

  listJourneyEvents(flightId: string): Promise<JourneyEvent[]>;
}
