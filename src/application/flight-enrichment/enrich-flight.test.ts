import { describe, expect, it } from "vitest";
import { Airline } from "../../domain/airport/airline";
import { IataCode, IcaoAirlineDesignator } from "../../domain/shared/airport-code";
import { AirlineReferenceProvider } from "../ports/airline-reference-provider";
import { FlightRouteLookupProvider, FlightRouteLookupResult } from "../ports/flight-route-lookup-provider";
import { EnrichFlightUseCase } from "./enrich-flight";

const ITA_AIRWAYS = new Airline(IataCode.create("AZ"), IcaoAirlineDesignator.create("ITY"), "ITA Airways");

class FakeAirlineProvider implements AirlineReferenceProvider {
  async findByIataCode(iataCode: string) {
    return iataCode.toUpperCase() === "AZ" ? ITA_AIRWAYS : null;
  }
  async search() {
    return [];
  }
}

class FakeRouteLookupProvider implements FlightRouteLookupProvider {
  constructor(private readonly result: FlightRouteLookupResult | null = null) {}
  async lookup() {
    return this.result;
  }
}

describe("EnrichFlightUseCase", () => {
  it("resolves the airline deterministically from the flight-number prefix", async () => {
    const useCase = new EnrichFlightUseCase(new FakeAirlineProvider(), new FakeRouteLookupProvider());
    const preview = await useCase.execute("AZ100", new Date("2026-07-10"));

    expect(preview.airline?.iataCode.toString()).toBe("AZ");
    expect(preview.flightNumber).toBe("AZ100");
  });

  it("gracefully reports an unresolvable airline as null rather than throwing (incomplete data is expected)", async () => {
    const useCase = new EnrichFlightUseCase(new FakeAirlineProvider(), new FakeRouteLookupProvider());
    const preview = await useCase.execute("ZZ999", new Date("2026-07-10"));

    expect(preview.airline).toBeNull();
  });

  it("passes through a route lookup result when the provider has one", async () => {
    const routeResult: FlightRouteLookupResult = { originIataCode: "BRI", destinationIataCode: "MXP", aircraftTypeIcaoCode: "A20N" };
    const useCase = new EnrichFlightUseCase(new FakeAirlineProvider(), new FakeRouteLookupProvider(routeResult));
    const preview = await useCase.execute("AZ100", new Date("2026-07-10"));

    expect(preview.route).toEqual(routeResult);
  });

  it("reports a null route when no lookup result is available (the Phase 1 default)", async () => {
    const useCase = new EnrichFlightUseCase(new FakeAirlineProvider(), new FakeRouteLookupProvider(null));
    const preview = await useCase.execute("AZ100", new Date("2026-07-10"));

    expect(preview.route).toBeNull();
  });
});
