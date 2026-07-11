import { Airport } from "../airport/airport";
import { getAirportCardRarity, getAirportFunFact } from "./card-catalog";
import { CardRarity } from "./card-rarity";

export class AirportCard {
  private constructor(
    readonly airport: Airport,
    readonly rarity: CardRarity,
  ) {}

  static from(airport: Airport): AirportCard {
    return new AirportCard(airport, getAirportCardRarity(airport.iataCode.toString()));
  }

  funFact(): string {
    return getAirportFunFact(this.airport.iataCode.toString(), this.airport.city, this.airport.country);
  }
}
