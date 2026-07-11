import { computeStatsSnapshot, StatsSnapshot } from "../../domain/statistics/stats-snapshot";
import { FlightLogRepository } from "../ports/flight-log-repository";

export class GetUserStatisticsUseCase {
  constructor(private readonly flightLogRepository: FlightLogRepository) {}

  async execute(userId: string): Promise<StatsSnapshot> {
    const flights = await this.flightLogRepository.listForUser(userId);
    return computeStatsSnapshot(flights);
  }
}
