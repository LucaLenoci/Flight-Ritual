import { Clock } from "../../application/ports/clock";
import { FlightDataProvider, ProviderFlightSnapshot } from "../../application/ports/flight-data-provider";
import { FLIGHT_FIXTURES } from "./fixtures/flight-fixtures";
import { resolveFixture, ResolvedFixture, simulateSnapshot } from "./fixtures/simulate-flight-timeline";

export interface TrackableFlightSummary {
  flightNumber: string;
  scheduledDepartureUtc: Date;
  originIataCode: string;
  destinationIataCode: string;
  airlineName: string;
}

/**
 * Fixture-backed FlightDataProvider adapter. Stands in for a real provider
 * (AeroDataBox, OpenSky, FlightAware, ...) behind the same port, so swapping
 * in a live integration later only means writing a new class here — nothing
 * upstream changes. Schedules are anchored to construction time so the demo
 * scenario is stable for the life of the process while phases still
 * progress naturally as real time passes.
 */
export class MockFlightDataProvider implements FlightDataProvider {
  private readonly resolvedFixtures: Map<string, ResolvedFixture>;

  constructor(private readonly clock: Clock) {
    const anchor = clock.now();
    this.resolvedFixtures = new Map(
      FLIGHT_FIXTURES.map((definition) => [definition.flightNumber, resolveFixture(definition, anchor)]),
    );
  }

  async fetchSnapshot(flightNumber: string, departureDateUtc: Date): Promise<ProviderFlightSnapshot | null> {
    const resolved = this.resolvedFixtures.get(flightNumber);
    if (!resolved) return null;
    if (resolved.scheduledDepartureUtc.getTime() !== departureDateUtc.getTime()) return null;
    return simulateSnapshot(resolved, this.clock.now());
  }

  /** Demo/search convenience, not part of the FlightDataProvider port: lists every flight currently available to track. */
  listTrackableFlights(): TrackableFlightSummary[] {
    return Array.from(this.resolvedFixtures.values()).map(({ definition, scheduledDepartureUtc }) => ({
      flightNumber: definition.flightNumber,
      scheduledDepartureUtc,
      originIataCode: definition.origin.iataCode,
      destinationIataCode: definition.destination.iataCode,
      airlineName: definition.airline.name,
    }));
  }
}
