/**
 * Port for resolving a flight's route/aircraft from its flight number and
 * date. No free, keyless, reliable open-data source exists for this lookup
 * across arbitrary past dates (OpenSky's historical endpoints need an
 * aircraft ICAO24/registration, not a flight-number+date key, and are
 * tightly rate-limited for anonymous access). The Phase 1 implementation
 * (NullFlightRouteLookupProvider) always returns null; this port exists so
 * a real provider can be wired in later without touching the domain or the
 * enrichment use case that calls it.
 */
export interface FlightRouteLookupResult {
  originIataCode: string;
  destinationIataCode: string;
  aircraftTypeIcaoCode: string | null;
}

export interface FlightRouteLookupProvider {
  lookup(flightNumber: string, date: Date): Promise<FlightRouteLookupResult | null>;
}
