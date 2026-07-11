/**
 * A curated ladder of "countries reached" milestones — a light collection
 * mechanic on top of the real stat, not a stored entity. Purely a function
 * of `uniqueCountryCount`, so it's always in sync with the real flight log
 * with no persistence of its own.
 */
export interface CountryMilestone {
  name: string;
  countryThreshold: number;
}

export const COUNTRY_MILESTONES: readonly CountryMilestone[] = [
  { name: "Wanderer", countryThreshold: 3 },
  { name: "Explorer", countryThreshold: 6 },
  { name: "Globetrotter", countryThreshold: 10 },
  { name: "Jetsetter", countryThreshold: 15 },
  { name: "World Voyager", countryThreshold: 20 },
  { name: "Aviation Legend", countryThreshold: 30 },
];

export interface NextCountryMilestone {
  milestone: CountryMilestone;
  countriesRemaining: number;
}

/** The next milestone still ahead of the user, or null once every milestone is reached. */
export function nextCountryMilestone(currentCountryCount: number): NextCountryMilestone | null {
  const milestone = COUNTRY_MILESTONES.find((m) => m.countryThreshold > currentCountryCount);
  if (!milestone) return null;
  return { milestone, countriesRemaining: milestone.countryThreshold - currentCountryCount };
}
