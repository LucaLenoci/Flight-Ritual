import { describe, expect, it } from "vitest";
import { FlightMemory, FlightMemorySnapshot } from "./flight-memory";
import { computeStatsSnapshot } from "./stats-snapshot";
import { buildUserCollection } from "./user-collection";

function snapshot(overrides: Partial<FlightMemorySnapshot> = {}): FlightMemorySnapshot {
  return {
    flightNumber: "BA284",
    airlineIataCode: "BA",
    airlineName: "British Airways",
    originIataCode: "LHR",
    originCity: "London",
    originCountry: "United Kingdom",
    destinationIataCode: "JFK",
    destinationCity: "New York",
    destinationCountry: "United States",
    departureDateUtc: new Date("2026-01-01T10:00:00Z"),
    distanceKm: 5540,
    durationMinutes: 480,
    aircraftTypeIcaoCode: "B77W",
    aircraftTypeModel: "Boeing 777-300ER",
    aircraftRegistration: "G-STBA",
    ...overrides,
  };
}

function memory(id: string, overrides: Partial<FlightMemorySnapshot> = {}): FlightMemory {
  return new FlightMemory(id, "user-1", `flight-${id}`, new Date(), null, snapshot(overrides));
}

describe("computeStatsSnapshot", () => {
  it("returns a zeroed snapshot for an empty collection", () => {
    const result = computeStatsSnapshot([]);
    expect(result.totalFlights).toBe(0);
    expect(result.longestFlight).toBeNull();
    expect(result.mostFrequentRoute).toBeNull();
  });

  it("accumulates distance and duration across multiple memories", () => {
    const memories = [
      memory("1", { distanceKm: 5540, durationMinutes: 480 }),
      memory("2", { distanceKm: 344, durationMinutes: 65, originIataCode: "LHR", destinationIataCode: "CDG" }),
    ];
    const result = computeStatsSnapshot(memories);
    expect(result.totalFlights).toBe(2);
    expect(result.totalDistanceKm).toBe(5884);
    expect(result.totalFlightMinutes).toBe(545);
  });

  it("counts unique airports, airlines, aircraft types, and countries (not raw flight count)", () => {
    const memories = [
      memory("1"), // LHR-JFK, BA, B77W
      memory("2", { flightNumber: "BA284" }), // same route/airline/aircraft as #1
    ];
    const result = computeStatsSnapshot(memories);
    expect(result.uniqueAirportCount).toBe(2);
    expect(result.uniqueAirlineCount).toBe(1);
    expect(result.uniqueAircraftTypeCount).toBe(1);
    expect(result.uniqueCountryCount).toBe(2);
  });

  it("identifies the longest flight by distance", () => {
    const memories = [
      memory("1", { flightNumber: "BA284", distanceKm: 5540 }),
      memory("2", { flightNumber: "BA1", distanceKm: 344 }),
      memory("3", { flightNumber: "QF1", distanceKm: 14500 }),
    ];
    const result = computeStatsSnapshot(memories);
    expect(result.longestFlight).toEqual({ flightNumber: "QF1", distanceKm: 14500 });
  });

  it("identifies the most frequently flown route", () => {
    const memories = [
      memory("1", { originIataCode: "LHR", destinationIataCode: "JFK" }),
      memory("2", { originIataCode: "LHR", destinationIataCode: "JFK" }),
      memory("3", { originIataCode: "LHR", destinationIataCode: "CDG" }),
    ];
    const result = computeStatsSnapshot(memories);
    expect(result.mostFrequentRoute).toEqual({ routeKey: "LHR-JFK", flightCount: 2 });
  });

  it("is order-independent (same memories in any order yield the same snapshot)", () => {
    const a = memory("1", { distanceKm: 1000 });
    const b = memory("2", { distanceKm: 2000 });
    const forward = computeStatsSnapshot([a, b]);
    const reversed = computeStatsSnapshot([b, a]);
    expect(forward).toEqual(reversed);
  });
});

describe("buildUserCollection", () => {
  it("deduplicates airports across origin and destination roles", () => {
    const memories = [
      memory("1", { originIataCode: "LHR", destinationIataCode: "JFK" }),
      memory("2", { originIataCode: "JFK", destinationIataCode: "LHR" }),
    ];
    const collection = buildUserCollection(memories);
    expect(collection.airportIataCodes.size).toBe(2);
    expect(collection.routeKeys.size).toBe(2); // LHR-JFK and JFK-LHR are distinct routes
  });
});
