import { PrismaClient } from "@prisma/client";
import { AirlineReferenceProvider } from "../../application/ports/airline-reference-provider";
import { Airline } from "../../domain/airport/airline";
import { toDomainAirline } from "../persistence/mappers";

export class PrismaAirlineReferenceProvider implements AirlineReferenceProvider {
  constructor(private readonly db: PrismaClient) {}

  async findByIataCode(iataCode: string): Promise<Airline | null> {
    const row = await this.db.airline.findUnique({ where: { iataCode: iataCode.trim().toUpperCase() } });
    return row ? toDomainAirline(row) : null;
  }

  async search(query: string, limit = 10): Promise<Airline[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const rows = await this.db.airline.findMany({
      where: {
        OR: [{ iataCode: { startsWith: trimmed.toUpperCase() } }, { name: { contains: trimmed } }],
      },
      take: limit,
      orderBy: { iataCode: "asc" },
    });
    return rows.map(toDomainAirline);
  }
}
