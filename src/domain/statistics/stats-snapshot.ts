import { LoggedFlight } from "../flight-log/logged-flight";
import { buildUserCollection } from "./user-collection";

export interface RouteFrequency {
  routeKey: string;
  flightCount: number;
  /** Share of total flights this route represents, 0-100, rounded to the nearest whole percent. */
  percentage: number;
}

export interface RankedAirline {
  iataCode: string;
  name: string;
  flightCount: number;
}

export interface RankedAircraftType {
  icaoTypeCode: string;
  model: string;
  flightCount: number;
}

export interface RankedAirport {
  iataCode: string;
  city: string;
  visitCount: number;
}

export interface LoggedFlightRef {
  flightNumber: string;
  flightDate: Date;
}

export interface StatsSnapshot {
  totalFlights: number;
  totalDistanceKm: number;
  uniqueAirportCount: number;
  uniqueAirlineCount: number;
  uniqueAircraftTypeCount: number;
  uniqueCountryCount: number;
  uniqueContinentCount: number;
  mostFlownAirline: RankedAirline | null;
  mostFlownAircraftType: RankedAircraftType | null;
  mostVisitedAirport: RankedAirport | null;
  longestFlight: { flightNumber: string; distanceKm: number } | null;
  firstLoggedFlight: LoggedFlightRef | null;
  latestLoggedFlight: LoggedFlightRef | null;
  mostFrequentRoute: RouteFrequency | null;
  /** Top 5 routes by flight count, descending — powers the route bar chart. */
  topRoutes: RouteFrequency[];
}

const EMPTY_SNAPSHOT: StatsSnapshot = {
  totalFlights: 0,
  totalDistanceKm: 0,
  uniqueAirportCount: 0,
  uniqueAirlineCount: 0,
  uniqueAircraftTypeCount: 0,
  uniqueCountryCount: 0,
  uniqueContinentCount: 0,
  mostFlownAirline: null,
  mostFlownAircraftType: null,
  mostVisitedAirport: null,
  longestFlight: null,
  firstLoggedFlight: null,
  latestLoggedFlight: null,
  mostFrequentRoute: null,
  topRoutes: [],
};

const TOP_ROUTES_LIMIT = 5;

function topEntry<T extends { flightCount: number } | { visitCount: number }>(
  counts: Map<string, T>,
): T | null {
  let top: T | null = null;
  let topCount = -1;
  for (const entry of counts.values()) {
    const count = "flightCount" in entry ? entry.flightCount : entry.visitCount;
    if (count > topCount) {
      top = entry;
      topCount = count;
    }
  }
  return top;
}

/** Pure, deterministic aggregation over a user's logged flights. */
export function computeStatsSnapshot(flights: readonly LoggedFlight[]): StatsSnapshot {
  if (flights.length === 0) return EMPTY_SNAPSHOT;

  const collection = buildUserCollection(flights);
  const routeCounts = new Map<string, number>();
  const airlineCounts = new Map<string, RankedAirline>();
  const aircraftTypeCounts = new Map<string, RankedAircraftType>();
  const airportVisits = new Map<string, RankedAirport>();

  let totalDistanceKm = 0;
  let longestFlight: { flightNumber: string; distanceKm: number } | null = null;
  let firstLoggedFlight: LoggedFlightRef | null = null;
  let latestLoggedFlight: LoggedFlightRef | null = null;

  for (const flight of flights) {
    const distanceKm = flight.distanceKm();
    totalDistanceKm += distanceKm;

    const routeKey = flight.route.routeKey();
    routeCounts.set(routeKey, (routeCounts.get(routeKey) ?? 0) + 1);

    const airlineKey = flight.airline.iataCode.toString();
    const airlineEntry = airlineCounts.get(airlineKey);
    airlineCounts.set(airlineKey, {
      iataCode: airlineKey,
      name: flight.airline.name,
      flightCount: (airlineEntry?.flightCount ?? 0) + 1,
    });

    if (flight.aircraftType) {
      const typeKey = flight.aircraftType.icaoTypeCode;
      const typeEntry = aircraftTypeCounts.get(typeKey);
      aircraftTypeCounts.set(typeKey, {
        icaoTypeCode: typeKey,
        model: flight.aircraftType.model,
        flightCount: (typeEntry?.flightCount ?? 0) + 1,
      });
    }

    for (const airport of [flight.route.origin, flight.route.destination]) {
      const airportKey = airport.iataCode.toString();
      const airportEntry = airportVisits.get(airportKey);
      airportVisits.set(airportKey, {
        iataCode: airportKey,
        city: airport.city,
        visitCount: (airportEntry?.visitCount ?? 0) + 1,
      });
    }

    if (!longestFlight || distanceKm > longestFlight.distanceKm) {
      longestFlight = { flightNumber: flight.flightNumber.toString(), distanceKm };
    }
    if (!firstLoggedFlight || flight.flightDate < firstLoggedFlight.flightDate) {
      firstLoggedFlight = { flightNumber: flight.flightNumber.toString(), flightDate: flight.flightDate };
    }
    if (!latestLoggedFlight || flight.flightDate > latestLoggedFlight.flightDate) {
      latestLoggedFlight = { flightNumber: flight.flightNumber.toString(), flightDate: flight.flightDate };
    }
  }

  const topRoutes = Array.from(routeCounts.entries())
    .map(([routeKey, flightCount]) => ({
      routeKey,
      flightCount,
      percentage: Math.round((flightCount / flights.length) * 100),
    }))
    .sort((a, b) => b.flightCount - a.flightCount)
    .slice(0, TOP_ROUTES_LIMIT);
  const mostFrequentRoute = topRoutes[0] ?? null;

  return {
    totalFlights: flights.length,
    totalDistanceKm,
    uniqueAirportCount: collection.airportIataCodes.size,
    uniqueAirlineCount: collection.airlineIataCodes.size,
    uniqueAircraftTypeCount: collection.aircraftTypeIcaoCodes.size,
    uniqueCountryCount: collection.countries.size,
    uniqueContinentCount: collection.continents.size,
    mostFlownAirline: topEntry(airlineCounts),
    mostFlownAircraftType: topEntry(aircraftTypeCounts),
    mostVisitedAirport: topEntry(airportVisits),
    longestFlight,
    firstLoggedFlight,
    latestLoggedFlight,
    mostFrequentRoute,
    topRoutes,
  };
}
