import { Airport } from "../../domain/airport/airport";

/**
 * Reference lookup over the seeded, open-data-backed Airport catalog.
 * Deliberately not tied to any one external provider — the infrastructure
 * implementation reads from local reference data (seeded from OurAirports),
 * not a live network call, so this port never fails on external outages.
 */
export interface AirportReferenceProvider {
  findByIataCode(iataCode: string): Promise<Airport | null>;
  /** Case-insensitive match against IATA code, name, or city — powers manual-entry typeahead. */
  search(query: string, limit?: number): Promise<Airport[]>;
}
