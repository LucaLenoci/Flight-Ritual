import { PrismaClient } from "@prisma/client";
import { LegacyRepository } from "../../application/ports/legacy-repository";
import { FlightMemory, FlightMemorySnapshot } from "../../domain/legacy/flight-memory";

export class PrismaLegacyRepository implements LegacyRepository {
  constructor(private readonly db: PrismaClient) {}

  async listForUser(userId: string): Promise<FlightMemory[]> {
    const rows = await this.db.flightMemory.findMany({
      where: { userId },
      orderBy: { savedAtUtc: "desc" },
    });
    return rows.map(toDomainFlightMemory);
  }

  async findByUserAndFlight(userId: string, flightId: string): Promise<FlightMemory | null> {
    const row = await this.db.flightMemory.findUnique({
      where: { userId_flightId: { userId, flightId } },
    });
    return row ? toDomainFlightMemory(row) : null;
  }

  async save(memory: FlightMemory): Promise<void> {
    await this.db.flightMemory.create({
      data: {
        id: memory.id,
        userId: memory.userId,
        flightId: memory.flightId,
        snapshotJson: JSON.stringify(memory.snapshot),
        savedAtUtc: memory.savedAtUtc,
        note: memory.note,
      },
    });
  }
}

function toDomainFlightMemory(row: {
  id: string;
  userId: string;
  flightId: string;
  savedAtUtc: Date;
  note: string | null;
  snapshotJson: string;
}): FlightMemory {
  const raw = JSON.parse(row.snapshotJson) as FlightMemorySnapshot;
  const snapshot: FlightMemorySnapshot = { ...raw, departureDateUtc: new Date(raw.departureDateUtc) };
  return new FlightMemory(row.id, row.userId, row.flightId, row.savedAtUtc, row.note, snapshot);
}
