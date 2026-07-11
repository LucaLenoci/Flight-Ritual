import { PrismaClient } from "@prisma/client";
import { AircraftTypeReferenceProvider } from "../../application/ports/aircraft-type-reference-provider";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { toDomainAircraftType } from "../persistence/mappers";

export class PrismaAircraftTypeReferenceProvider implements AircraftTypeReferenceProvider {
  constructor(private readonly db: PrismaClient) {}

  async findByIcaoTypeCode(icaoTypeCode: string): Promise<AircraftType | null> {
    const row = await this.db.aircraftType.findUnique({ where: { icaoTypeCode: icaoTypeCode.trim().toUpperCase() } });
    return row ? toDomainAircraftType(row) : null;
  }

  async listAll(): Promise<AircraftType[]> {
    const rows = await this.db.aircraftType.findMany({ orderBy: { model: "asc" } });
    return rows.map(toDomainAircraftType);
  }
}
