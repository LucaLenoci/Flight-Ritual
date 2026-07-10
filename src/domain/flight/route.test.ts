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

  it("interpolates the origin and destination exactly at fractions 0 and 1", () => {
    const route = new Route(lhr, jfk);
    const start = route.interpolatePosition(0);
    const end = route.interpolatePosition(1);
    expect(start.latitude).toBeCloseTo(lhr.coordinates.latitude, 3);
    expect(start.longitude).toBeCloseTo(lhr.coordinates.longitude, 3);
    expect(end.latitude).toBeCloseTo(jfk.coordinates.latitude, 3);
    expect(end.longitude).toBeCloseTo(jfk.coordinates.longitude, 3);
  });

  it("clamps out-of-range fractions instead of extrapolating", () => {
    const route = new Route(lhr, jfk);
    const beforeStart = route.interpolatePosition(-0.5);
    const afterEnd = route.interpolatePosition(1.5);
    expect(beforeStart.latitude).toBeCloseTo(lhr.coordinates.latitude, 3);
    expect(afterEnd.latitude).toBeCloseTo(jfk.coordinates.latitude, 3);
  });

  it("computes a westward-leaning initial bearing from LHR toward JFK", () => {
    const route = new Route(lhr, jfk);
    const bearing = route.bearingFrom({ latitude: lhr.coordinates.latitude, longitude: lhr.coordinates.longitude });
    // Great-circle route to JFK initially heads north-west, not due west.
    expect(bearing).toBeGreaterThan(270);
    expect(bearing).toBeLessThan(320);
  });
});
