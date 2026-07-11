import { Airline } from "../airport/airline";
import { getAirlineCardMeta } from "./card-catalog";
import { CardRarity } from "./card-rarity";

export class AirlineCard {
  private constructor(
    readonly airline: Airline,
    readonly rarity: CardRarity,
    readonly country: string,
    readonly liveryColorHex: string,
    readonly funFact: string,
  ) {}

  static from(airline: Airline): AirlineCard {
    const meta = getAirlineCardMeta(airline.iataCode.toString());
    return new AirlineCard(airline, meta.rarity, meta.country, meta.liveryColorHex, meta.funFact);
  }
}
