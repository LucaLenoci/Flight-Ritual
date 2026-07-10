import { FlightMemory } from "../../domain/legacy/flight-memory";

export interface LegacyRepository {
  /** All memories are scoped by userId — callers must never accept a client-supplied userId, only the authenticated session's. */
  listForUser(userId: string): Promise<FlightMemory[]>;
  findByUserAndFlight(userId: string, flightId: string): Promise<FlightMemory | null>;
  save(memory: FlightMemory): Promise<void>;
}
