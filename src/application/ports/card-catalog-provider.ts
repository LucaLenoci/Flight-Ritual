import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";

/**
 * Lists the full universe of collectible cards a user could ever unlock —
 * used to render locked silhouettes for cards not yet owned and to compute
 * completeness stats ("5 of 9 airports"). Backed by the same fixture data
 * the flight tracker uses, since that's this app's entire real-world
 * catalog; a production system would back this with a real reference
 * dataset instead.
 */
export interface CardCatalogProvider {
  listAirportCards(): AirportCard[];
  listAircraftCards(): AircraftCard[];
  listAirlineCards(): AirlineCard[];
}
