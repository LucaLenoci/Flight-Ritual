import { Airline } from "../../domain/airport/airline";

/** Reference lookup over the seeded, open-data-backed Airline catalog (seeded from OpenFlights). */
export interface AirlineReferenceProvider {
  findByIataCode(iataCode: string): Promise<Airline | null>;
  search(query: string, limit?: number): Promise<Airline[]>;
}
