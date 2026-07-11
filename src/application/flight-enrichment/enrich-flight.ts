import { Airline } from "../../domain/airport/airline";
import { FlightNumber } from "../../domain/shared/flight-number";
import { AirlineReferenceProvider } from "../ports/airline-reference-provider";
import { FlightRouteLookupProvider, FlightRouteLookupResult } from "../ports/flight-route-lookup-provider";

export interface EnrichmentPreview {
  flightNumber: string;
  /** Deterministically resolved from the flight-number prefix against the seeded Airline catalog; null if unresolvable (unknown designator), not an error. */
  airline: Airline | null;
  /** From FlightRouteLookupProvider; null in Phase 1 (no reliable free source), meaning route/aircraft type need manual entry. */
  route: FlightRouteLookupResult | null;
}

/**
 * Preview-only enrichment: given a flight number and date, resolves what
 * can be resolved for free and flags what still needs manual entry. Does
 * not persist anything — SaveLoggedFlightUseCase re-derives the same
 * enrichment independently at save time rather than trusting this preview's
 * output back from the client.
 */
export class EnrichFlightUseCase {
  constructor(
    private readonly airlineReferenceProvider: AirlineReferenceProvider,
    private readonly flightRouteLookupProvider: FlightRouteLookupProvider,
  ) {}

  async execute(flightNumberRaw: string, date: Date): Promise<EnrichmentPreview> {
    const flightNumber = FlightNumber.create(flightNumberRaw);
    const [airline, route] = await Promise.all([
      this.airlineReferenceProvider.findByIataCode(flightNumber.airlineDesignator),
      this.flightRouteLookupProvider.lookup(flightNumber.toString(), date),
    ]);

    return { flightNumber: flightNumber.toString(), airline, route };
  }
}
