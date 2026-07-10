import { FlightMemory } from "../../domain/legacy/flight-memory";
import { computeStatsSnapshot, StatsSnapshot } from "../../domain/legacy/stats-snapshot";
import { buildUserCollection, UserCollection } from "../../domain/legacy/user-collection";
import { LegacyRepository } from "../ports/legacy-repository";

export interface UserLegacyView {
  memories: FlightMemory[];
  collection: UserCollection;
  stats: StatsSnapshot;
}

/**
 * Assembles the My Flight Legacy dashboard for one user. Always scoped by
 * the caller-supplied userId — callers (API routes) must derive that id from
 * the authenticated session, never from client-supplied input, so one user
 * can never read another's legacy data.
 */
export class GetUserLegacyUseCase {
  constructor(private readonly legacyRepository: LegacyRepository) {}

  async execute(userId: string): Promise<UserLegacyView> {
    const memories = await this.legacyRepository.listForUser(userId);
    return {
      memories,
      collection: buildUserCollection(memories),
      stats: computeStatsSnapshot(memories),
    };
  }
}
