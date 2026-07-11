import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";

/**
 * Lists the full universe of collectible cards a user could ever unlock —
 * used to render locked silhouettes for cards not yet owned and to compute
 * completeness stats ("214 of 640 airports"). Backed by the seeded
 * open-data reference catalog (Airport/Airline/AircraftType), not any one
 * external provider directly.
 */
export interface CardCatalogProvider {
  listAirportCards(): Promise<AirportCard[]>;
  listAircraftCards(): Promise<AircraftCard[]>;
  listAirlineCards(): Promise<AirlineCard[]>;
}
