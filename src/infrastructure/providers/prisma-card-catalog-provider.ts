import { PrismaClient } from "@prisma/client";
import { CardCatalogProvider } from "../../application/ports/card-catalog-provider";
import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";
import { toDomainAircraftType, toDomainAirline, toDomainAirport } from "../persistence/mappers";

/**
 * The collectible-card catalog is now the full seeded open-data reference
 * catalog (see infrastructure/seed/seed-reference-data.ts), not a fixture
 * derived from demo flights — every airport/airline/aircraft type a user
 * could plausibly log unlocks a real, pre-existing card silhouette rather
 * than one materializing only after the fact.
 */
export class PrismaCardCatalogProvider implements CardCatalogProvider {
  constructor(private readonly db: PrismaClient) {}

  async listAirportCards(): Promise<AirportCard[]> {
    const rows = await this.db.airport.findMany({ orderBy: { iataCode: "asc" } });
    return rows.map(toDomainAirport).map(AirportCard.from);
  }

  async listAircraftCards(): Promise<AircraftCard[]> {
    const rows = await this.db.aircraftType.findMany({ orderBy: { icaoTypeCode: "asc" } });
    return rows.map(toDomainAircraftType).map(AircraftCard.from);
  }

  async listAirlineCards(): Promise<AirlineCard[]> {
    const rows = await this.db.airline.findMany({ orderBy: { iataCode: "asc" } });
    return rows.map(toDomainAirline).map(AirlineCard.from);
  }
}
