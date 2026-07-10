import { AircraftDataProvider, ProviderAircraftDetails } from "../../application/ports/aircraft-data-provider";
import { Clock } from "../../application/ports/clock";
import { FLIGHT_FIXTURES } from "./fixtures/flight-fixtures";
import { resolveFixture, ResolvedFixture } from "./fixtures/simulate-flight-timeline";

// Airlines typically finalize the specific tail number a couple of hours
// before departure; before that, only the historical pattern is known.
const CONFIRMATION_LEAD_MINUTES = 120;

/**
 * Fixture-backed AircraftDataProvider. Deliberately only returns a live
 * "confirmed" assignment once the simulated flight is close to departure —
 * this is what makes the Aircraft Enrichment fallback chain (confirmed ->
 * historical -> unknown) actually exercise all three states in the demo
 * rather than always taking the same path.
 */
export class MockAircraftDataProvider implements AircraftDataProvider {
  private readonly resolvedFixtures: Map<string, ResolvedFixture>;

  constructor(private readonly clock: Clock) {
    const anchor = clock.now();
    this.resolvedFixtures = new Map(
      FLIGHT_FIXTURES.map((definition) => [definition.flightNumber, resolveFixture(definition, anchor)]),
    );
  }

  async fetchConfirmedAssignment(flightNumber: string): Promise<ProviderAircraftDetails | null> {
    const resolved = this.resolvedFixtures.get(flightNumber);
    if (!resolved) return null;

    const confirmationAt = new Date(
      resolved.scheduledDepartureUtc.getTime() - CONFIRMATION_LEAD_MINUTES * 60_000,
    );
    if (this.clock.now() < confirmationAt) return null;

    return this.toProviderDetails(resolved);
  }

  async fetchHistoricalPattern(flightNumber: string): Promise<ProviderAircraftDetails | null> {
    const resolved = this.resolvedFixtures.get(flightNumber);
    if (!resolved) return null;
    // In this fixture set we only model one representative aircraft per
    // flight number; a real adapter would aggregate several past flights.
    return this.toProviderDetails(resolved);
  }

  private toProviderDetails(resolved: ResolvedFixture): ProviderAircraftDetails {
    const { aircraft } = resolved.definition;
    return {
      registration: aircraft.registration,
      type: aircraft.type,
      operatorIataCode: aircraft.operatorIataCode,
      manufactureDate: aircraft.manufactureDate,
    };
  }
}
