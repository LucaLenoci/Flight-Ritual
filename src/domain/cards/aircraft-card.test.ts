import { describe, expect, it } from "vitest";
import { AircraftType } from "../aircraft/aircraft-type";
import { AircraftCard } from "./aircraft-card";
import { CardRarity } from "./card-rarity";

describe("AircraftCard", () => {
  it("resolves curated rarity and engine type for a known aircraft type", () => {
    const type = new AircraftType("A388", "Airbus", "A380-800", ["The world's largest passenger airliner."]);
    const card = AircraftCard.from(type);
    expect(card.rarity).toBe(CardRarity.LEGENDARY);
    expect(card.engineType).toContain("Trent 900");
  });

  it("falls back to COMMON for an aircraft type outside the curated catalog", () => {
    const type = new AircraftType("XXXX", "Unknown Co", "Mystery Jet", []);
    const card = AircraftCard.from(type);
    expect(card.rarity).toBe(CardRarity.COMMON);
  });

  it("reuses the aircraft type's first fact as the card's fun fact", () => {
    const type = new AircraftType("A20N", "Airbus", "A320neo", ["Fact one.", "Fact two."]);
    const card = AircraftCard.from(type);
    expect(card.funFact()).toBe("Fact one.");
  });

  it("falls back to a generic message when the aircraft type has no facts", () => {
    const type = new AircraftType("XXXX", "Unknown Co", "Mystery Jet", []);
    const card = AircraftCard.from(type);
    expect(card.funFact()).toMatch(/fly this aircraft/i);
  });
});
