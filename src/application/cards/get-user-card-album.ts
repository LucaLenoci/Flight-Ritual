import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";
import { CardCatalogProvider } from "../ports/card-catalog-provider";
import { CardRepository } from "../ports/card-repository";

export interface AlbumEntry<TCard> {
  card: TCard;
  owned: boolean;
  firstCollectedAtUtc: Date | null;
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
 * withhold data the UI is allowed to have.
 */
export class GetUserCardAlbumUseCase {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly catalogProvider: CardCatalogProvider,
  ) {}

  async execute(userId: string): Promise<UserCardAlbum> {
    const [ownedAirports, ownedAircraft, ownedAirlines, catalogAirports, catalogAircraft, catalogAirlines] =
      await Promise.all([
        this.cardRepository.listUserAirportCards(userId),
        this.cardRepository.listUserAircraftCards(userId),
        this.cardRepository.listUserAirlineCards(userId),
        this.catalogProvider.listAirportCards(),
        this.catalogProvider.listAircraftCards(),
        this.catalogProvider.listAirlineCards(),
      ]);

    const airportOwnership = new Map(ownedAirports.map((c) => [c.airportIataCode, c.firstCollectedAtUtc]));
    const aircraftOwnership = new Map(ownedAircraft.map((c) => [c.aircraftTypeIcaoCode, c.firstCollectedAtUtc]));
    const airlineOwnership = new Map(ownedAirlines.map((c) => [c.airlineIataCode, c.firstCollectedAtUtc]));

    return {
      airports: catalogAirports.map((card) => ({
        card,
        owned: airportOwnership.has(card.airport.iataCode.toString()),
        firstCollectedAtUtc: airportOwnership.get(card.airport.iataCode.toString()) ?? null,
      })),
      aircraft: catalogAircraft.map((card) => ({
        card,
        owned: aircraftOwnership.has(card.aircraftType.icaoTypeCode),
        firstCollectedAtUtc: aircraftOwnership.get(card.aircraftType.icaoTypeCode) ?? null,
      })),
      airlines: catalogAirlines.map((card) => ({
        card,
        owned: airlineOwnership.has(card.airline.iataCode.toString()),
        firstCollectedAtUtc: airlineOwnership.get(card.airline.iataCode.toString()) ?? null,
      })),
    };
  }
}
