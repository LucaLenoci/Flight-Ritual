import { PrismaClient } from "@prisma/client";
import { AirportReferenceProvider } from "../../application/ports/airport-reference-provider";
import { Airport } from "../../domain/airport/airport";
import { toDomainAirport } from "../persistence/mappers";

export class PrismaAirportReferenceProvider implements AirportReferenceProvider {
  constructor(private readonly db: PrismaClient) {}

  async findByIataCode(iataCode: string): Promise<Airport | null> {
    const row = await this.db.airport.findUnique({ where: { iataCode: iataCode.trim().toUpperCase() } });
    return row ? toDomainAirport(row) : null;
  }

  async search(query: string, limit = 10): Promise<Airport[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const rows = await this.db.airport.findMany({
      where: {
        OR: [
          { iataCode: { startsWith: trimmed.toUpperCase() } },
          { city: { contains: trimmed } },
          { name: { contains: trimmed } },
        ],
      },
      take: limit,
      orderBy: { iataCode: "asc" },
    });
    return rows.map(toDomainAirport);
  }
}
