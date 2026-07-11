/**
 * Rarity tiers are a starting taxonomy (per the design-system brief): real
 * rarity should eventually be driven by actual collection-rate data across
 * the user base. This app has no real user base yet, so tiers here are a
 * hand-curated placeholder over the fixed fixture catalog — see
 * card-catalog.ts. Never surface an unbacked "X% of flyers have this"
 * stat alongside it.
 */
export enum CardRarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  LEGENDARY = "LEGENDARY",
}
