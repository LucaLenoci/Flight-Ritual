import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";
import { countEntityFlights } from "../../domain/statistics/entity-flight-counts";
import { CardCatalogProvider } from "../ports/card-catalog-provider";
import { CardRepository } from "../ports/card-repository";
import { FlightLogRepository } from "../ports/flight-log-repository";

export interface AlbumEntry<TCard> {
  card: TCard;
  owned: boolean;
  firstCollectedAtUtc: Date | null;
  timesFlown: number;
  sourceLoggedFlightId: string | null;
}

export interface UserCardAlbum {
  airports: AlbumEntry<AirportCard>[];
  aircraft: AlbumEntry<AircraftCard>[];
  airlines: AlbumEntry<AirlineCard>[];
}

/**
 * Assembles the full album for a user: every card in the catalog, each
 * marked owned/locked. Locked entries still carry the full card (rarity
 * included) so the UI can render a silhouette teaser — only presentation
 * decides to hide the art/code for locked cards, this use case doesn't
 * withhold data the UI is allowed to have. `timesFlown` reflects the whole
 * flight log, not just the single flight that first unlocked the card.
 */
export class GetUserCardAlbumUseCase {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly catalogProvider: CardCatalogProvider,
    private readonly flightLogRepository: FlightLogRepository,
  ) {}

  async execute(userId: string): Promise<UserCardAlbum> {
    const [ownedAirports, ownedAircraft, ownedAirlines, catalogAirports, catalogAircraft, catalogAirlines, flights] =
      await Promise.all([
        this.cardRepository.listUserAirportCards(userId),
        this.cardRepository.listUserAircraftCards(userId),
        this.cardRepository.listUserAirlineCards(userId),
        this.catalogProvider.listAirportCards(),
        this.catalogProvider.listAircraftCards(),
        this.catalogProvider.listAirlineCards(),
        this.flightLogRepository.listForUser(userId),
      ]);

    const airportOwnership = new Map(ownedAirports.map((c) => [c.airportIataCode, c]));
    const aircraftOwnership = new Map(ownedAircraft.map((c) => [c.aircraftTypeIcaoCode, c]));
    const airlineOwnership = new Map(ownedAirlines.map((c) => [c.airlineIataCode, c]));
    const { airportCounts, aircraftTypeCounts, airlineCounts } = countEntityFlights(flights);

    return {
      airports: catalogAirports.map((card) => {
        const code = card.airport.iataCode.toString();
        const ownership = airportOwnership.get(code);
        return {
          card,
          owned: ownership !== undefined,
          firstCollectedAtUtc: ownership?.firstCollectedAtUtc ?? null,
          timesFlown: airportCounts.get(code) ?? 0,
          sourceLoggedFlightId: ownership?.sourceLoggedFlightId ?? null,
        };
      }),
      aircraft: catalogAircraft.map((card) => {
        const code = card.aircraftType.icaoTypeCode;
        const ownership = aircraftOwnership.get(code);
        return {
          card,
          owned: ownership !== undefined,
          firstCollectedAtUtc: ownership?.firstCollectedAtUtc ?? null,
          timesFlown: aircraftTypeCounts.get(code) ?? 0,
          sourceLoggedFlightId: ownership?.sourceLoggedFlightId ?? null,
        };
      }),
      airlines: catalogAirlines.map((card) => {
        const code = card.airline.iataCode.toString();
        const ownership = airlineOwnership.get(code);
        return {
          card,
          owned: ownership !== undefined,
          firstCollectedAtUtc: ownership?.firstCollectedAtUtc ?? null,
          timesFlown: airlineCounts.get(code) ?? 0,
          sourceLoggedFlightId: ownership?.sourceLoggedFlightId ?? null,
        };
      }),
    };
  }
}
