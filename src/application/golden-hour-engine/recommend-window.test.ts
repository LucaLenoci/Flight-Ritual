import { describe, expect, it } from "vitest";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { Route } from "../../domain/flight/route";
import {
  GOLDEN_HOUR_MAX_ELEVATION_DEG,
  GOLDEN_HOUR_MIN_ELEVATION_DEG,
} from "../../domain/golden-hour/evaluate-window-recommendation";
import { WindowSide } from "../../domain/golden-hour/window-recommendation";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";
import { ZonedInstant } from "../../domain/shared/zoned-instant";
import { RecommendWindowUseCase } from "./recommend-window";

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

function buildFlight(scheduledDepartureUtc: Date, scheduledArrivalUtc: Date): Flight {
  const lhr = airport("LHR", "EGLL", 51.47, -0.4543, "Europe/London");
  const jfk = airport("JFK", "KJFK", 40.6413, -73.7781, "America/New_York");
  return new Flight(
    "flight-1",
    FlightNumber.create("BA284"),
    new Airline(IataCode.create("BA"), IcaoAirlineDesignator.create("BAW"), "British Airways"),
    new Route(lhr, jfk),
    ZonedInstant.fromUtc(scheduledDepartureUtc, lhr.timeZone),
    ZonedInstant.fromUtc(scheduledArrivalUtc, jfk.timeZone),
    FlightPhase.SCHEDULED,
    0,
    null,
    null,
    null,
    null,
  );
}

describe("RecommendWindowUseCase", () => {
  it("is deterministic: the same flight always produces the same recommendation", () => {
    const flight = buildFlight(new Date("2026-07-10T17:00:00Z"), new Date("2026-07-11T01:00:00Z"));
    const useCase = new RecommendWindowUseCase();
    const first = useCase.execute(flight);
    const second = useCase.execute(flight);
    expect(second).toEqual(first);
  });

  it("returns NOT_APPLICABLE for a zero-duration flight instead of dividing by zero", () => {
    const sameInstant = new Date("2026-07-10T17:00:00Z");
    const flight = buildFlight(sameInstant, sameInstant);
    const useCase = new RecommendWindowUseCase();
    const result = useCase.execute(flight);
    expect(result.side).toBe(WindowSide.NOT_APPLICABLE);
  });

  it("when a golden-hour window is found, the elevation is within the defined golden-hour band", () => {
    // A long westbound evening-departure flight is very likely to cross a
    // golden-hour moment somewhere along an 8-hour transatlantic route.
    const flight = buildFlight(new Date("2026-07-10T17:00:00Z"), new Date("2026-07-11T01:00:00Z"));
    const useCase = new RecommendWindowUseCase();
    const result = useCase.execute(flight);

    if (result.side !== WindowSide.NOT_APPLICABLE) {
      expect(result.sunElevationDeg).toBeGreaterThanOrEqual(GOLDEN_HOUR_MIN_ELEVATION_DEG);
      expect(result.sunElevationDeg).toBeLessThanOrEqual(GOLDEN_HOUR_MAX_ELEVATION_DEG);
      expect(result.reason.length).toBeGreaterThan(0);
      expect(result.bestMomentUtc).not.toBeNull();
      expect(result.bestMomentUtc!.getTime()).toBeGreaterThanOrEqual(flight.scheduledDeparture.utcDate.getTime());
      expect(result.bestMomentUtc!.getTime()).toBeLessThanOrEqual(flight.scheduledArrival.utcDate.getTime());
    }
  });
});
