import { beforeEach, describe, expect, it } from "vitest";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { FieldProvenance } from "../../domain/flight-log/field-provenance";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { Coordinates } from "../../domain/shared/coordinates";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { UnknownReferenceEntityError } from "../errors";
import { AircraftTypeReferenceProvider } from "../ports/aircraft-type-reference-provider";
import { AirlineReferenceProvider } from "../ports/airline-reference-provider";
import { AirportReferenceProvider } from "../ports/airport-reference-provider";
import { Clock } from "../ports/clock";
import { FlightLogRepository } from "../ports/flight-log-repository";
import { FlightRouteLookupProvider, FlightRouteLookupResult } from "../ports/flight-route-lookup-provider";
import { SaveLoggedFlightUseCase } from "./save-logged-flight";

function airport(iata: string): Airport {
  return new Airport(
    IataCode.create(iata),
    IcaoAirportCode.create(`X${iata}`),
    `${iata} Airport`,
    "City",
    "Country",
    Coordinates.create(0, 0),
    "UTC",
  );
}

const BRI = airport("BRI");
const MXP = airport("MXP");
const ITA_AIRWAYS = new Airline(IataCode.create("AZ"), IcaoAirlineDesignator.create("ITY"), "ITA Airways");
const A20N = new AircraftType("A20N", "Airbus", "A320neo", []);

class FakeAirportProvider implements AirportReferenceProvider {
  async findByIataCode(iataCode: string) {
    return [BRI, MXP].find((a) => a.iataCode.toString() === iataCode.toUpperCase()) ?? null;
  }
  async search() {
    return [];
  }
}

class FakeAirlineProvider implements AirlineReferenceProvider {
  async findByIataCode(iataCode: string) {
    return iataCode.toUpperCase() === "AZ" ? ITA_AIRWAYS : null;
  }
  async search() {
    return [];
  }
}

class FakeAircraftTypeProvider implements AircraftTypeReferenceProvider {
  async findByIcaoTypeCode(code: string) {
    return code.toUpperCase() === "A20N" ? A20N : null;
  }
  async listAll() {
    return [A20N];
  }
}

class FakeRouteLookupProvider implements FlightRouteLookupProvider {
  constructor(private readonly result: FlightRouteLookupResult | null = null) {}
  async lookup() {
    return this.result;
  }
}

class InMemoryFlightLogRepository implements FlightLogRepository {
  public saved: LoggedFlight[] = [];
  async save(flight: LoggedFlight) {
    this.saved.push(flight);
  }
  async findById(id: string) {
    return this.saved.find((f) => f.id === id) ?? null;
  }
  async listForUser(userId: string) {
    return this.saved.filter((f) => f.userId === userId);
  }
}

const fixedClock: Clock = { now: () => new Date("2026-07-11T00:00:00Z") };

function buildUseCase(routeLookupResult: FlightRouteLookupResult | null = null) {
  const flightLogRepository = new InMemoryFlightLogRepository();
  const useCase = new SaveLoggedFlightUseCase(
    flightLogRepository,
    new FakeAirportProvider(),
    new FakeAirlineProvider(),
    new FakeAircraftTypeProvider(),
    new FakeRouteLookupProvider(routeLookupResult),
    fixedClock,
    () => "flight-id-1",
  );
  return { useCase, flightLogRepository };
}

describe("SaveLoggedFlightUseCase", () => {
  let base: { useCase: SaveLoggedFlightUseCase; flightLogRepository: InMemoryFlightLogRepository };

  beforeEach(() => {
    base = buildUseCase();
  });

  it("rejects an unknown origin airport code rather than trusting client input", async () => {
    await expect(
      base.useCase.execute("user-1", {
        flightNumber: "AZ100",
        flightDate: new Date("2026-07-10"),
        originIataCode: "ZZZ",
        destinationIataCode: "MXP",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: null,
        tailNumber: null,
        note: null,
      }),
    ).rejects.toBeInstanceOf(UnknownReferenceEntityError);
  });

  it("rejects an unknown airline code", async () => {
    await expect(
      base.useCase.execute("user-1", {
        flightNumber: "ZZ100",
        flightDate: new Date("2026-07-10"),
        originIataCode: "BRI",
        destinationIataCode: "MXP",
        airlineIataCode: "ZZ",
        aircraftTypeIcaoCode: null,
        tailNumber: null,
        note: null,
      }),
    ).rejects.toBeInstanceOf(UnknownReferenceEntityError);
  });

  it("rejects an unknown aircraft type code", async () => {
    await expect(
      base.useCase.execute("user-1", {
        flightNumber: "AZ100",
        flightDate: new Date("2026-07-10"),
        originIataCode: "BRI",
        destinationIataCode: "MXP",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: "ZZZZ",
        tailNumber: null,
        note: null,
      }),
    ).rejects.toBeInstanceOf(UnknownReferenceEntityError);
  });

  it("marks the airline as ENRICHED when it matches the flight-number-prefix resolution", async () => {
    const flight = await base.useCase.execute("user-1", {
      flightNumber: "AZ100",
      flightDate: new Date("2026-07-10"),
      originIataCode: "BRI",
      destinationIataCode: "MXP",
      airlineIataCode: "AZ",
      aircraftTypeIcaoCode: null,
      tailNumber: null,
      note: null,
    });

    expect(flight.provenance.airline).toBe(FieldProvenance.ENRICHED);
  });

  it("marks origin/destination/aircraftType as USER_PROVIDED when no route lookup result is available (Phase 1 default)", async () => {
    const flight = await base.useCase.execute("user-1", {
      flightNumber: "AZ100",
      flightDate: new Date("2026-07-10"),
      originIataCode: "BRI",
      destinationIataCode: "MXP",
      airlineIataCode: "AZ",
      aircraftTypeIcaoCode: "A20N",
      tailNumber: null,
      note: null,
    });

    expect(flight.provenance.origin).toBe(FieldProvenance.USER_PROVIDED);
    expect(flight.provenance.destination).toBe(FieldProvenance.USER_PROVIDED);
    expect(flight.provenance.aircraftType).toBe(FieldProvenance.USER_PROVIDED);
  });

  it("marks route fields as ENRICHED when a route lookup provider confirms them (future-provider path)", async () => {
    const { useCase } = buildUseCase({ originIataCode: "BRI", destinationIataCode: "MXP", aircraftTypeIcaoCode: "A20N" });

    const flight = await useCase.execute("user-1", {
      flightNumber: "AZ100",
      flightDate: new Date("2026-07-10"),
      originIataCode: "BRI",
      destinationIataCode: "MXP",
      airlineIataCode: "AZ",
      aircraftTypeIcaoCode: "A20N",
      tailNumber: null,
      note: null,
    });

    expect(flight.provenance.origin).toBe(FieldProvenance.ENRICHED);
    expect(flight.provenance.destination).toBe(FieldProvenance.ENRICHED);
    expect(flight.provenance.aircraftType).toBe(FieldProvenance.ENRICHED);
  });

  it("does not silently overwrite a user's manual correction: a route lookup mismatch stays USER_PROVIDED", async () => {
    // Route lookup suggests JFK, but the user manually corrected to MXP — the save must respect the user's value and record it as such.
    const { useCase } = buildUseCase({ originIataCode: "BRI", destinationIataCode: "JFK", aircraftTypeIcaoCode: null });

    const flight = await useCase.execute("user-1", {
      flightNumber: "AZ100",
      flightDate: new Date("2026-07-10"),
      originIataCode: "BRI",
      destinationIataCode: "MXP",
      airlineIataCode: "AZ",
      aircraftTypeIcaoCode: null,
      tailNumber: null,
      note: null,
    });

    expect(flight.route.destination.iataCode.toString()).toBe("MXP");
    expect(flight.provenance.destination).toBe(FieldProvenance.USER_PROVIDED);
  });

  it("handles a flight with no aircraft type gracefully (incomplete data is valid, not an error)", async () => {
    const flight = await base.useCase.execute("user-1", {
      flightNumber: "AZ100",
      flightDate: new Date("2026-07-10"),
      originIataCode: "BRI",
      destinationIataCode: "MXP",
      airlineIataCode: "AZ",
      aircraftTypeIcaoCode: null,
      tailNumber: null,
      note: null,
    });

    expect(flight.aircraftType).toBeNull();
  });
});
