import { describe, expect, it } from "vitest";
import { Airport } from "../airport/airport";
import { Coordinates } from "../shared/coordinates";
import { IataCode, IcaoAirportCode } from "../shared/airport-code";
import { Route } from "./route";

function airport(iata: string, icao: string, lat: number, lon: number, timeZone: string): Airport {
  return new Airport(
    IataCode.create(iata),
    IcaoAirportCode.create(icao),
    `${iata} Airport`,
    "City",
    "Country",
    Coordinates.create(lat, lon),
    timeZone,
  );
}

describe("Route", () => {
  const lhr = airport("LHR", "EGLL", 51.4700, -0.4543, "Europe/London");
  const jfk = airport("JFK", "KJFK", 40.6413, -73.7781, "America/New_York");

  it("computes a great-circle distance close to the known LHR-JFK distance (~5540km)", () => {
    const route = new Route(lhr, jfk);
    expect(route.distanceKm()).toBeGreaterThan(5400);
    expect(route.distanceKm()).toBeLessThan(5650);
  });

  it("derives a stable route key from origin and destination IATA codes", () => {
    const route = new Route(lhr, jfk);
    expect(route.routeKey()).toBe("LHR-JFK");
  });
});
