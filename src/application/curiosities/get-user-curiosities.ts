import { nextCountryMilestone, NextCountryMilestone } from "../../domain/curiosities/country-milestones";
import { GetUserCardAlbumUseCase } from "../cards/get-user-card-album";
import { GetUserStatisticsUseCase } from "../statistics/get-user-statistics";

export interface CuriosityFact {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  title: string;
  body: string;
}

export interface UserCuriosities {
  countryCount: number;
  nextMilestone: NextCountryMilestone | null;
  facts: CuriosityFact[];
}

/**
 * Surfaces "did you know?" facts and the next collection milestone, both
 * derived entirely from the user's real card album and stats — no
 * fabricated or placeholder content. Composes the two use cases that
 * already assemble that data rather than re-querying repositories directly.
 */
export class GetUserCuriositiesUseCase {
  constructor(
    private readonly getUserCardAlbum: GetUserCardAlbumUseCase,
    private readonly getUserStatistics: GetUserStatisticsUseCase,
  ) {}

  async execute(userId: string): Promise<UserCuriosities> {
    const [album, stats] = await Promise.all([
      this.getUserCardAlbum.execute(userId),
      this.getUserStatistics.execute(userId),
    ]);

    const facts: CuriosityFact[] = [];

    const latestAirport = mostRecentlyCollected(album.airports);
    if (latestAirport) {
      facts.push({ kind: "AIRPORT", title: `${latestAirport.card.airport.city} Airport Fact`, body: latestAirport.card.funFact() });
    }

    const latestAircraft = mostRecentlyCollected(album.aircraft);
    if (latestAircraft) {
      facts.push({ kind: "AIRCRAFT", title: `${latestAircraft.card.aircraftType.model} Fact`, body: latestAircraft.card.funFact() });
    }

    const latestAirline = mostRecentlyCollected(album.airlines);
    if (latestAirline) {
      facts.push({ kind: "AIRLINE", title: `${latestAirline.card.airline.name} Fact`, body: latestAirline.card.funFact });
    }

    return {
      countryCount: stats.uniqueCountryCount,
      nextMilestone: nextCountryMilestone(stats.uniqueCountryCount),
      facts,
    };
  }
}

function mostRecentlyCollected<TCard>(
  entries: { card: TCard; owned: boolean; firstCollectedAtUtc: Date | null }[],
): { card: TCard; firstCollectedAtUtc: Date } | null {
  const owned = entries.filter(
    (e): e is { card: TCard; owned: true; firstCollectedAtUtc: Date } => e.owned && e.firstCollectedAtUtc !== null,
  );
  if (owned.length === 0) return null;
  return owned.reduce((latest, entry) => (entry.firstCollectedAtUtc > latest.firstCollectedAtUtc ? entry : latest));
}
