import { beforeEach, describe, expect, it } from "vitest";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { Coordinates } from "../../domain/shared/coordinates";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { CardRepository } from "../ports/card-repository";
import { AircraftTypeReferenceProvider } from "../ports/aircraft-type-reference-provider";
import { AirlineReferenceProvider } from "../ports/airline-reference-provider";
import { AirportReferenceProvider } from "../ports/airport-reference-provider";
import { Clock } from "../ports/clock";
import { FlightLogRepository } from "../ports/flight-log-repository";
import { FlightRouteLookupProvider } from "../ports/flight-route-lookup-provider";
import { UnlockCardsForFlightUseCase } from "../cards/unlock-cards-for-flight";
import { BulkSaveLoggedFlightsUseCase } from "./bulk-save-logged-flights";
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
  async lookup() {
    return null;
  }
}

class InMemoryFlightLogRepository implements FlightLogRepository {
  public saved = new Map<string, LoggedFlight>();
  async save(flight: LoggedFlight) {
    this.saved.set(flight.id, flight);
  }
  async findById(id: string) {
    return this.saved.get(id) ?? null;
  }
  async listForUser(userId: string) {
    return Array.from(this.saved.values()).filter((f) => f.userId === userId);
  }
}

class InMemoryCardRepository implements CardRepository {
  private keys = new Set<string>();
  private async tryUnlock(kind: string, key: string) {
    const compoundKey = `${kind}:${key}`;
    if (this.keys.has(compoundKey)) return false;
    this.keys.add(compoundKey);
    return true;
  }
  async tryUnlockAirportCard(userId: string, airportIataCode: string) {
    return this.tryUnlock("airport", `${userId}:${airportIataCode}`);
  }
  async tryUnlockAircraftCard(userId: string, aircraftTypeIcaoCode: string) {
    return this.tryUnlock("aircraft", `${userId}:${aircraftTypeIcaoCode}`);
  }
  async tryUnlockAirlineCard(userId: string, airlineIataCode: string) {
    return this.tryUnlock("airline", `${userId}:${airlineIataCode}`);
  }
  async listUserAirportCards() {
    return [];
  }
  async listUserAircraftCards() {
    return [];
  }
  async listUserAirlineCards() {
    return [];
  }
}

const fixedClock: Clock = { now: () => new Date("2026-07-11T00:00:00Z") };

describe("BulkSaveLoggedFlightsUseCase", () => {
  let flightLogRepository: InMemoryFlightLogRepository;
  let useCase: BulkSaveLoggedFlightsUseCase;
  let idCounter: number;

  beforeEach(() => {
    flightLogRepository = new InMemoryFlightLogRepository();
    idCounter = 0;
    const saveLoggedFlight = new SaveLoggedFlightUseCase(
      flightLogRepository,
      new FakeAirportProvider(),
      new FakeAirlineProvider(),
      new FakeAircraftTypeProvider(),
      new FakeRouteLookupProvider(),
      fixedClock,
      () => `flight-${++idCounter}`,
    );
    const unlockCardsForFlight = new UnlockCardsForFlightUseCase(new InMemoryCardRepository(), flightLogRepository, fixedClock);
    useCase = new BulkSaveLoggedFlightsUseCase(saveLoggedFlight, unlockCardsForFlight);
  });

  it("saves every valid row and evaluates unlocks for each", async () => {
    const results = await useCase.execute("user-1", [
      {
        flightNumber: "AZ100",
        flightDate: new Date("2026-07-10"),
        originIataCode: "BRI",
        destinationIataCode: "MXP",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: "A20N",
        tailNumber: null,
        note: null,
      },
      {
        flightNumber: "AZ101",
        flightDate: new Date("2026-07-11"),
        originIataCode: "MXP",
        destinationIataCode: "BRI",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: "A20N",
        tailNumber: null,
        note: null,
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(await flightLogRepository.listForUser("user-1")).toHaveLength(2);
  });

  it("keeps saving the remaining rows when one row references an unknown airport", async () => {
    const results = await useCase.execute("user-1", [
      {
        flightNumber: "AZ100",
        flightDate: new Date("2026-07-10"),
        originIataCode: "BRI",
        destinationIataCode: "MXP",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: null,
        tailNumber: null,
        note: null,
      },
      {
        flightNumber: "AZ200",
        flightDate: new Date("2026-07-11"),
        originIataCode: "ZZZ",
        destinationIataCode: "MXP",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: null,
        tailNumber: null,
        note: null,
      },
      {
        flightNumber: "AZ300",
        flightDate: new Date("2026-07-12"),
        originIataCode: "BRI",
        destinationIataCode: "MXP",
        airlineIataCode: "AZ",
        aircraftTypeIcaoCode: null,
        tailNumber: null,
        note: null,
      },
    ]);

    expect(results[0]!.success).toBe(true);
    expect(results[1]!.success).toBe(false);
    expect(results[1]!.error).toContain("ZZZ");
    expect(results[2]!.success).toBe(true);
    expect(await flightLogRepository.listForUser("user-1")).toHaveLength(2);
  });
});
