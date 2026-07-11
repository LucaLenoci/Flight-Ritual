import { describe, expect, it } from "vitest";
import { AircraftType } from "../aircraft/aircraft-type";
import { Airline } from "../airport/airline";
import { Airport } from "../airport/airport";
import { FieldProvenance, LoggedFlightProvenance } from "../flight-log/field-provenance";
import { LoggedFlight } from "../flight-log/logged-flight";
import { Route } from "../flight-log/route";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../shared/airport-code";
import { Coordinates } from "../shared/coordinates";
import { FlightNumber } from "../shared/flight-number";
import { computeStatsSnapshot } from "./stats-snapshot";

const ALL_USER_PROVIDED: LoggedFlightProvenance = {
  airline: FieldProvenance.USER_PROVIDED,
  origin: FieldProvenance.USER_PROVIDED,
  destination: FieldProvenance.USER_PROVIDED,
  aircraftType: FieldProvenance.USER_PROVIDED,
};

function airport(iata: string, lat: number, lon: number, country: string, continent: string): Airport {
  return new Airport(
    IataCode.create(iata),
    IcaoAirportCode.create(`X${iata}`),
    `${iata} Airport`,
    `${iata} City`,
    country,
    Coordinates.create(lat, lon),
    "UTC",
    continent,
  );
}

const BRI = airport("BRI", 41.14, 16.76, "Italy", "EU");
const MXP = airport("MXP", 45.63, 8.72, "Italy", "EU");
const JFK = airport("JFK", 40.64, -73.78, "United States", "NA");

const ITA_AIRWAYS = new Airline(IataCode.create("AZ"), IcaoAirlineDesignator.create("ITY"), "ITA Airways");
const DELTA = new Airline(IataCode.create("DL"), IcaoAirlineDesignator.create("DAL"), "Delta Air Lines");
const A20N = new AircraftType("A20N", "Airbus", "A320neo", []);
const A21N = new AircraftType("A21N", "Airbus", "A321neo", []);

let nextId = 0;
function flight(opts: {
  flightNumber: string;
  date: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  aircraftType?: AircraftType | null;
}): LoggedFlight {
  nextId += 1;
  return new LoggedFlight(
    `flight-${nextId}`,
    "user-1",
    FlightNumber.create(opts.flightNumber),
    new Date(opts.date),
    opts.airline,
    new Route(opts.origin, opts.destination),
    opts.aircraftType ?? null,
    null,
    null,
    ALL_USER_PROVIDED,
    new Date(opts.date),
  );
}

describe("computeStatsSnapshot", () => {
  it("returns an empty snapshot for no flights", () => {
    const snapshot = computeStatsSnapshot([]);
    expect(snapshot.totalFlights).toBe(0);
    expect(snapshot.longestFlight).toBeNull();
    expect(snapshot.mostFlownAirline).toBeNull();
  });

  it("aggregates totals, uniques, and rankings across multiple flights", () => {
    const flights = [
      flight({ flightNumber: "AZ100", date: "2026-01-01", airline: ITA_AIRWAYS, origin: BRI, destination: MXP, aircraftType: A20N }),
      flight({ flightNumber: "AZ101", date: "2026-02-01", airline: ITA_AIRWAYS, origin: BRI, destination: MXP, aircraftType: A21N }),
      flight({ flightNumber: "DL200", date: "2026-03-01", airline: DELTA, origin: MXP, destination: JFK, aircraftType: A20N }),
    ];

    const snapshot = computeStatsSnapshot(flights);

    expect(snapshot.totalFlights).toBe(3);
    expect(snapshot.uniqueAirportCount).toBe(3); // BRI, MXP, JFK
    expect(snapshot.uniqueAirlineCount).toBe(2);
    expect(snapshot.uniqueAircraftTypeCount).toBe(2);
    expect(snapshot.uniqueCountryCount).toBe(2); // Italy, United States
    expect(snapshot.uniqueContinentCount).toBe(2); // EU, NA

    // ITA Airways flown twice, Delta once.
    expect(snapshot.mostFlownAirline?.iataCode).toBe("AZ");
    expect(snapshot.mostFlownAirline?.flightCount).toBe(2);

    // A20N flown twice (flights 1 and 3), A21N once.
    expect(snapshot.mostFlownAircraftType?.icaoTypeCode).toBe("A20N");
    expect(snapshot.mostFlownAircraftType?.flightCount).toBe(2);

    // MXP appears on all three flights (twice as destination, once as origin) -> visited 3 times.
    expect(snapshot.mostVisitedAirport?.iataCode).toBe("MXP");
    expect(snapshot.mostVisitedAirport?.visitCount).toBe(3);

    // BRI-MXP flown twice, MXP-JFK once.
    expect(snapshot.mostFrequentRoute?.routeKey).toBe("BRI-MXP");
    expect(snapshot.mostFrequentRoute?.flightCount).toBe(2);

    // MXP-JFK (great-circle ~6800km) is longer than BRI-MXP (~600km).
    expect(snapshot.longestFlight?.flightNumber).toBe("DL200");

    expect(snapshot.firstLoggedFlight?.flightNumber).toBe("AZ100");
    expect(snapshot.latestLoggedFlight?.flightNumber).toBe("DL200");
  });

  it("handles flights with no aircraft type without throwing or counting them toward aircraft stats", () => {
    const flights = [
      flight({ flightNumber: "AZ100", date: "2026-01-01", airline: ITA_AIRWAYS, origin: BRI, destination: MXP, aircraftType: null }),
    ];

    const snapshot = computeStatsSnapshot(flights);

    expect(snapshot.uniqueAircraftTypeCount).toBe(0);
    expect(snapshot.mostFlownAircraftType).toBeNull();
  });
});
