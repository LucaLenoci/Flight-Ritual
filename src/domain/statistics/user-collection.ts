import { LoggedFlight } from "../flight-log/logged-flight";

export interface UserCollection {
  airportIataCodes: ReadonlySet<string>;
  airlineIataCodes: ReadonlySet<string>;
  aircraftTypeIcaoCodes: ReadonlySet<string>;
  routeKeys: ReadonlySet<string>;
  countries: ReadonlySet<string>;
  continents: ReadonlySet<string>;
}

/** Pure aggregation: derives the set of distinct airports/airlines/aircraft/routes/countries/continents visited. */
export function buildUserCollection(flights: readonly LoggedFlight[]): UserCollection {
  const airportIataCodes = new Set<string>();
  const airlineIataCodes = new Set<string>();
  const aircraftTypeIcaoCodes = new Set<string>();
  const routeKeys = new Set<string>();
  const countries = new Set<string>();
  const continents = new Set<string>();

  for (const flight of flights) {
    airportIataCodes.add(flight.route.origin.iataCode.toString());
    airportIataCodes.add(flight.route.destination.iataCode.toString());
    airlineIataCodes.add(flight.airline.iataCode.toString());
    if (flight.aircraftType) aircraftTypeIcaoCodes.add(flight.aircraftType.icaoTypeCode);
    routeKeys.add(flight.route.routeKey());
    countries.add(flight.route.origin.country);
    countries.add(flight.route.destination.country);
    if (flight.route.origin.continent) continents.add(flight.route.origin.continent);
    if (flight.route.destination.continent) continents.add(flight.route.destination.continent);
  }

  return { airportIataCodes, airlineIataCodes, aircraftTypeIcaoCodes, routeKeys, countries, continents };
}
