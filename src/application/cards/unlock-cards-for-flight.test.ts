import { beforeEach, describe, expect, it } from "vitest";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { FieldProvenance, LoggedFlightProvenance } from "../../domain/flight-log/field-provenance";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { Route } from "../../domain/flight-log/route";
import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";
import { CardRepository } from "../ports/card-repository";
import { Clock } from "../ports/clock";
import { FlightLogRepository } from "../ports/flight-log-repository";
import { UnlockCardsForFlightUseCase } from "./unlock-cards-for-flight";

class InMemoryCardRepository implements CardRepository {
  private airportKeys = new Set<string>();
  private aircraftKeys = new Set<string>();
  private airlineKeys = new Set<string>();
  public airportUnlockAttempts = 0;
  public aircraftUnlockAttempts = 0;
  public airlineUnlockAttempts = 0;

  async tryUnlockAirportCard(userId: string, airportIataCode: string) {
    this.airportUnlockAttempts += 1;
    const key = `${userId}:${airportIataCode}`;
    if (this.airportKeys.has(key)) return false;
    this.airportKeys.add(key);
    return true;
  }

  async tryUnlockAircraftCard(userId: string, aircraftTypeIcaoCode: string) {
    this.aircraftUnlockAttempts += 1;
    const key = `${userId}:${aircraftTypeIcaoCode}`;
    if (this.aircraftKeys.has(key)) return false;
    this.aircraftKeys.add(key);
    return true;
  }

  async tryUnlockAirlineCard(userId: string, airlineIataCode: string) {
    this.airlineUnlockAttempts += 1;
    const key = `${userId}:${airlineIataCode}`;
    if (this.airlineKeys.has(key)) return false;
    this.airlineKeys.add(key);
    return true;
  }

  async listUserAirportCards(): Promise<UserAirportCard[]> {
    return [];
  }
  async listUserAircraftCards(): Promise<UserAircraftCard[]> {
    return [];
  }
  async listUserAirlineCards(): Promise<UserAirlineCard[]> {
    return [];
  }
}

class InMemoryFlightLogRepository implements FlightLogRepository {
  private flightsById = new Map<string, LoggedFlight>();

  add(flight: LoggedFlight) {
    this.flightsById.set(flight.id, flight);
  }
  async findById(id: string) {
    return this.flightsById.get(id) ?? null;
  }
  async save(flight: LoggedFlight) {
    this.flightsById.set(flight.id, flight);
  }
  async listForUser(userId: string) {
    return Array.from(this.flightsById.values()).filter((f) => f.userId === userId);
  }
}

const fixedClock: Clock = { now: () => new Date("2026-07-11T00:00:00Z") };

const ALL_ENRICHED: LoggedFlightProvenance = {
  airline: FieldProvenance.ENRICHED,
  origin: FieldProvenance.USER_PROVIDED,
  destination: FieldProvenance.USER_PROVIDED,
  aircraftType: FieldProvenance.USER_PROVIDED,
};

function airport(iata: string, icao: string): Airport {
  return new Airport(
    IataCode.create(iata),
    IcaoAirportCode.create(icao),
    `${iata} Airport`,
    "City",
    "Country",
    Coordinates.create(0, 0),
    "UTC",
  );
}

/** Mirrors the business-rule worked example: Bari -> Milan Malpensa on ITA Airways. */
function buildLoggedFlight(
  id: string,
  userId: string,
  flightNumberStr: string,
  aircraftTypeCode: string | null,
): LoggedFlight {
  const bri = airport("BRI", "LIBD");
  const mxp = airport("MXP", "LIMC");
  const aircraftType = aircraftTypeCode ? new AircraftType(aircraftTypeCode, "Airbus", `${aircraftTypeCode} model`, []) : null;

  return new LoggedFlight(
    id,
    userId,
    FlightNumber.create(flightNumberStr),
    new Date("2026-07-10T00:00:00Z"),
    new Airline(IataCode.create("AZ"), IcaoAirlineDesignator.create("ITY"), "ITA Airways"),
    new Route(bri, mxp),
    aircraftType,
    null,
    null,
    ALL_ENRICHED,
    new Date(),
  );
}

describe("UnlockCardsForFlightUseCase", () => {
  let cardRepository: InMemoryCardRepository;
  let flightLogRepository: InMemoryFlightLogRepository;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    flightLogRepository = new InMemoryFlightLogRepository();
  });

  it("unlocks a card per new airport, aircraft model, and airline on a first-ever flight", async () => {
    const flight = buildLoggedFlight("flight-1", "user-1", "AZ100", "A20N");
    flightLogRepository.add(flight);
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, flightLogRepository, fixedClock);

    const result = await useCase.execute("user-1", "flight-1");

    expect(result.newAirportCards.map((c) => c.airport.iataCode.toString())).toEqual(["BRI", "MXP"]);
    expect(result.newAircraftCards).toHaveLength(1);
    expect(result.newAirlineCards).toHaveLength(1);
  });

  it("does not create duplicate cards or re-fire unlocks when the same route/aircraft/airline repeats", async () => {
    const flight = buildLoggedFlight("flight-1", "user-1", "AZ100", "A20N");
    flightLogRepository.add(flight);
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, flightLogRepository, fixedClock);

    await useCase.execute("user-1", "flight-1");
    const second = await useCase.execute("user-1", "flight-1");

    expect(second.newAirportCards).toHaveLength(0);
    expect(second.newAircraftCards).toHaveLength(0);
    expect(second.newAirlineCards).toHaveLength(0);
  });

  it("unlocks only the aircraft card when a new aircraft model flies an already-known route/airline", async () => {
    const first = buildLoggedFlight("flight-1", "user-1", "AZ100", "A20N");
    flightLogRepository.add(first);
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, flightLogRepository, fixedClock);
    await useCase.execute("user-1", "flight-1");

    // Second flight: same BRI/MXP route, same ITA Airways, but a different aircraft model (A321) never flown before.
    const second = buildLoggedFlight("flight-2", "user-1", "AZ101", "A321");
    flightLogRepository.add(second);
    const result = await useCase.execute("user-1", "flight-2");

    expect(result.newAirportCards).toHaveLength(0);
    expect(result.newAirlineCards).toHaveLength(0);
    expect(result.newAircraftCards).toHaveLength(1);
    expect(result.newAircraftCards[0]!.aircraftType.icaoTypeCode).toBe("A321");
  });

  it("gracefully skips aircraft card evaluation when the flight's aircraft type is unknown/incomplete", async () => {
    const flight = buildLoggedFlight("flight-1", "user-1", "AZ100", null);
    flightLogRepository.add(flight);
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, flightLogRepository, fixedClock);

    const result = await useCase.execute("user-1", "flight-1");

    expect(result.newAircraftCards).toHaveLength(0);
    expect(cardRepository.aircraftUnlockAttempts).toBe(0);
  });

  it("scopes card ownership per user: two users logging the same flight both unlock their own cards", async () => {
    const flightUser1 = buildLoggedFlight("flight-1", "user-1", "AZ100", "A20N");
    const flightUser2 = buildLoggedFlight("flight-2", "user-2", "AZ100", "A20N");
    flightLogRepository.add(flightUser1);
    flightLogRepository.add(flightUser2);
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, flightLogRepository, fixedClock);

    const userOne = await useCase.execute("user-1", "flight-1");
    const userTwo = await useCase.execute("user-2", "flight-2");

    expect(userOne.newAirlineCards).toHaveLength(1);
    expect(userTwo.newAirlineCards).toHaveLength(1);
  });
});
