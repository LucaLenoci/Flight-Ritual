import { AircraftType } from "../aircraft/aircraft-type";
import { getAircraftCardMeta } from "./card-catalog";
import { CardRarity } from "./card-rarity";

/**
 * Wraps AircraftType (the *model*, e.g. "Airbus A320neo") — never a
 * specific tail-numbered Aircraft instance/registration. A user collects
 * one Aircraft Card per model flown, regardless of how many different
 * physical aircraft of that model they've been on.
 */
export class AircraftCard {
  private constructor(
    readonly aircraftType: AircraftType,
    readonly rarity: CardRarity,
    readonly engineType: string,
  ) {}

  static from(aircraftType: AircraftType): AircraftCard {
    const meta = getAircraftCardMeta(aircraftType.icaoTypeCode);
    return new AircraftCard(aircraftType, meta.rarity, meta.engineType);
  }

  /** One concrete, slightly surprising sentence — reuses the Aircraft Reveal facts rather than duplicating content. */
  funFact(): string {
    return this.aircraftType.facts[0] ?? "Fly this aircraft again to update its card with new details.";
  }
}
