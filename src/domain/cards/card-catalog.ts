import { CardRarity } from "./card-rarity";

/**
 * Card-specific reference data — rarity tier, engine type, livery accent,
 * fun fact — kept as domain-owned static lookups (pure, zero I/O) rather
 * than infrastructure state, the same way Golden Hour's elevation
 * thresholds are domain constants. Deliberately separate from the
 * Journey-Tracking domain entities (Airport/AircraftType/Airline): those
 * model flight-operational facts, this models trading-card facts about the
 * same real-world entities — different bounded contexts, same referents.
 *
 * Curated for exactly the airports/aircraft types/airlines that appear in
 * this app's fixture flights, which is also therefore the entire
 * collectible "catalog universe" for this demo (no infinite real-world
 * airport database exists here). Entities outside the fixture set fall
 * back to CardRarity.COMMON with a generic fact placeholder rather than
 * failing.
 */

const AIRPORT_RARITY: Record<string, CardRarity> = {
  LHR: CardRarity.COMMON,
  JFK: CardRarity.COMMON,
  LAX: CardRarity.COMMON,
  FRA: CardRarity.COMMON,
  SFO: CardRarity.COMMON,
  DXB: CardRarity.UNCOMMON,
  SIN: CardRarity.UNCOMMON,
  NRT: CardRarity.UNCOMMON,
  PER: CardRarity.RARE,
};

export function getAirportCardRarity(iataCode: string): CardRarity {
  return AIRPORT_RARITY[iataCode] ?? CardRarity.COMMON;
}

// Curated, verified trivia for a handful of well-known airports. No free
// curated dataset of per-airport trivia exists for the full bulk-seeded
// catalog (thousands of airports), so this stays a small, honest,
// expandable list rather than fabricated filler — airports outside it fall
// back to a plain, data-derived (never invented) observation.
const AIRPORT_FUN_FACTS: Record<string, string> = {
  KEF: "Keflavík sits on a lava field — Iceland's main airport was built by the US military in WWII.",
  LHR: "Heathrow is the busiest airport in Europe by passenger traffic, despite having only two runways.",
  HND: "Haneda's international terminal was built on reclaimed land in Tokyo Bay.",
  DXB: "Dubai International has no dedicated cargo-only runway, yet is one of the world's busiest cargo hubs.",
  JFK: "JFK's original 1948 name was New York International Airport, renamed after President Kennedy in 1963.",
  SIN: "Singapore Changi has its own butterfly garden and a rooftop swimming pool inside the terminal.",
  LAX: "LAX's iconic Theme Building was designed to look like a flying saucer for the Space Age.",
  SFO: "San Francisco International is built on a peninsula and is gradually sinking due to landfill settlement.",
};

export function getAirportFunFact(iataCode: string, city: string, country: string): string {
  return AIRPORT_FUN_FACTS[iataCode] ?? `${city} sits in ${country} — fly here again to add more to its story.`;
}

interface AircraftCardMeta {
  rarity: CardRarity;
  engineType: string;
}

const AIRCRAFT_CARD_META: Record<string, AircraftCardMeta> = {
  B77W: { rarity: CardRarity.COMMON, engineType: "GE90 turbofan" },
  A20N: { rarity: CardRarity.COMMON, engineType: "CFM LEAP-1A turbofan" },
  A359: { rarity: CardRarity.UNCOMMON, engineType: "Rolls-Royce Trent XWB turbofan" },
  B789: { rarity: CardRarity.UNCOMMON, engineType: "GEnx-1B turbofan" },
  A388: { rarity: CardRarity.LEGENDARY, engineType: "Rolls-Royce Trent 900 turbofan" },
};

export function getAircraftCardMeta(icaoTypeCode: string): AircraftCardMeta {
  return AIRCRAFT_CARD_META[icaoTypeCode] ?? { rarity: CardRarity.COMMON, engineType: "Unknown" };
}

interface AirlineCardMeta {
  rarity: CardRarity;
  country: string;
  liveryColorHex: string;
  funFact: string;
}

const AIRLINE_CARD_META: Record<string, AirlineCardMeta> = {
  BA: {
    rarity: CardRarity.COMMON,
    country: "United Kingdom",
    liveryColorHex: "#075AAA",
    funFact: "British Airways operated the last commercial Concorde flight in 2003, ending an era of supersonic passenger travel.",
  },
  DL: {
    rarity: CardRarity.COMMON,
    country: "United States",
    liveryColorHex: "#C01933",
    funFact: "Delta operates one of the world's largest airline maintenance bases, spanning over 500 acres in Atlanta.",
  },
  LH: {
    rarity: CardRarity.COMMON,
    country: "Germany",
    liveryColorHex: "#05164D",
    funFact: "Lufthansa's crane logo, designed in 1918, is one of the oldest continuously used airline logos in the world.",
  },
  UA: {
    rarity: CardRarity.COMMON,
    country: "United States",
    liveryColorHex: "#002244",
    funFact: "United was the first airline to fly the Boeing 747 on a scheduled passenger route across the Pacific.",
  },
  EK: {
    rarity: CardRarity.UNCOMMON,
    country: "United Arab Emirates",
    liveryColorHex: "#D71921",
    funFact: "Emirates is the world's largest operator of both the Airbus A380 and the Boeing 777.",
  },
  QF: {
    rarity: CardRarity.UNCOMMON,
    country: "Australia",
    liveryColorHex: "#E40000",
    funFact: "Qantas is the world's second-oldest airline still operating under its original name, founded in 1920.",
  },
  SQ: {
    rarity: CardRarity.RARE,
    country: "Singapore",
    liveryColorHex: "#F99F1C",
    funFact: "Singapore Airlines was the launch customer for the Airbus A380, flying the type's first commercial service in 2007.",
  },
};

const DEFAULT_AIRLINE_META: AirlineCardMeta = {
  rarity: CardRarity.COMMON,
  country: "Unknown",
  liveryColorHex: "#2F7DFF",
  funFact: "Fly this airline again to update its card with new details.",
};

export function getAirlineCardMeta(iataCode: string): AirlineCardMeta {
  return AIRLINE_CARD_META[iataCode] ?? DEFAULT_AIRLINE_META;
}
