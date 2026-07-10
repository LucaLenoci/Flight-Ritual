import { FlightMemory } from "./flight-memory";
import { buildUserCollection } from "./user-collection";

export interface RouteFrequency {
  routeKey: string;
  flightCount: number;
}

export interface StatsSnapshot {
  totalFlights: number;
  totalDistanceKm: number;
  totalFlightMinutes: number;
  uniqueAirportCount: number;
  uniqueAirlineCount: number;
  uniqueAircraftTypeCount: number;
  uniqueCountryCount: number;
  longestFlight: { flightNumber: string; distanceKm: number } | null;
  mostFrequentRoute: RouteFrequency | null;
}

const EMPTY_SNAPSHOT: StatsSnapshot = {
  totalFlights: 0,
  totalDistanceKm: 0,
  totalFlightMinutes: 0,
  uniqueAirportCount: 0,
  uniqueAirlineCount: 0,
  uniqueAircraftTypeCount: 0,
  uniqueCountryCount: 0,
  longestFlight: null,
  mostFrequentRoute: null,
};

/** Pure, deterministic aggregation over a user's saved flight memories. */
export function computeStatsSnapshot(memories: readonly FlightMemory[]): StatsSnapshot {
  if (memories.length === 0) return EMPTY_SNAPSHOT;

  const collection = buildUserCollection(memories);
  const routeCounts = new Map<string, number>();
  let totalDistanceKm = 0;
  let totalFlightMinutes = 0;
  let longestFlight: { flightNumber: string; distanceKm: number } | null = null;

  for (const memory of memories) {
    const { snapshot } = memory;
    totalDistanceKm += snapshot.distanceKm;
    totalFlightMinutes += snapshot.durationMinutes;

    const routeKey = memory.routeKey();
    routeCounts.set(routeKey, (routeCounts.get(routeKey) ?? 0) + 1);

    if (!longestFlight || snapshot.distanceKm > longestFlight.distanceKm) {
      longestFlight = { flightNumber: snapshot.flightNumber, distanceKm: snapshot.distanceKm };
    }
  }

  let mostFrequentRoute: RouteFrequency | null = null;
  for (const [routeKey, flightCount] of routeCounts) {
    if (!mostFrequentRoute || flightCount > mostFrequentRoute.flightCount) {
      mostFrequentRoute = { routeKey, flightCount };
    }
  }

  return {
    totalFlights: memories.length,
    totalDistanceKm,
    totalFlightMinutes,
    uniqueAirportCount: collection.airportIataCodes.size,
    uniqueAirlineCount: collection.airlineIataCodes.size,
    uniqueAircraftTypeCount: collection.aircraftTypeIcaoCodes.size,
    uniqueCountryCount: collection.countries.size,
    longestFlight,
    mostFrequentRoute,
  };
}
