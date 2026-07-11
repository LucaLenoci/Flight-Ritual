import { LoggedFlight } from "../../domain/flight-log/logged-flight";

export interface FlightLogRepository {
  save(flight: LoggedFlight): Promise<void>;
  findById(id: string): Promise<LoggedFlight | null>;
  /** All flights are scoped by userId — callers must never accept a client-supplied userId, only the authenticated session's. */
  listForUser(userId: string): Promise<LoggedFlight[]>;
}
