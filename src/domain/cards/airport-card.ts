import { Airport } from "../airport/airport";
import { getAirportCardRarity } from "./card-catalog";
import { CardRarity } from "./card-rarity";

export class AirportCard {
  private constructor(
    readonly airport: Airport,
    readonly rarity: CardRarity,
  ) {}

  static from(airport: Airport): AirportCard {
    return new AirportCard(airport, getAirportCardRarity(airport.iataCode.toString()));
  }
}
