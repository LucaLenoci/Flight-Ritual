import { FlightMemory } from "./flight-memory";

export interface UserCollection {
  airportIataCodes: ReadonlySet<string>;
  airlineIataCodes: ReadonlySet<string>;
  aircraftTypeIcaoCodes: ReadonlySet<string>;
  routeKeys: ReadonlySet<string>;
  countries: ReadonlySet<string>;
}

/** Pure aggregation: derives the set of distinct airports/airlines/aircraft/routes/countries visited. */
export function buildUserCollection(memories: readonly FlightMemory[]): UserCollection {
  const airportIataCodes = new Set<string>();
  const airlineIataCodes = new Set<string>();
  const aircraftTypeIcaoCodes = new Set<string>();
  const routeKeys = new Set<string>();
  const countries = new Set<string>();

  for (const memory of memories) {
    const { snapshot } = memory;
    airportIataCodes.add(snapshot.originIataCode);
    airportIataCodes.add(snapshot.destinationIataCode);
    airlineIataCodes.add(snapshot.airlineIataCode);
    if (snapshot.aircraftTypeIcaoCode) aircraftTypeIcaoCodes.add(snapshot.aircraftTypeIcaoCode);
    routeKeys.add(memory.routeKey());
    countries.add(snapshot.originCountry);
    countries.add(snapshot.destinationCountry);
  }

  return { airportIataCodes, airlineIataCodes, aircraftTypeIcaoCodes, routeKeys, countries };
}
