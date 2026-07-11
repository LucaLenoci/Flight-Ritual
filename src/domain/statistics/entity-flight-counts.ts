import { LoggedFlight } from "../flight-log/logged-flight";

export interface EntityFlightCounts {
  airportCounts: ReadonlyMap<string, number>;
  aircraftTypeCounts: ReadonlyMap<string, number>;
  airlineCounts: ReadonlyMap<string, number>;
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/**
 * How many times each airport/aircraft-type/airline appears across a user's
 * flights — distinct from card *ownership* (unlocked once) or the
 * top-ranked "most flown" stats. Powers Card Detail's "Times flown" figure,
 * which reflects the full log, not just the unlock event.
 */
export function countEntityFlights(flights: readonly LoggedFlight[]): EntityFlightCounts {
  const airportCounts = new Map<string, number>();
  const aircraftTypeCounts = new Map<string, number>();
  const airlineCounts = new Map<string, number>();

  for (const flight of flights) {
    increment(airportCounts, flight.route.origin.iataCode.toString());
    increment(airportCounts, flight.route.destination.iataCode.toString());
    if (flight.aircraftType) increment(aircraftTypeCounts, flight.aircraftType.icaoTypeCode);
    increment(airlineCounts, flight.airline.iataCode.toString());
  }

  return { airportCounts, aircraftTypeCounts, airlineCounts };
}
