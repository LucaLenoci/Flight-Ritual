import { beforeEach, describe, expect, it } from "vitest";
import { Aircraft } from "../../domain/aircraft/aircraft";
import { AircraftAssignment, AssignmentConfidence, AssignmentSource } from "../../domain/aircraft/aircraft-assignment";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { Route } from "../../domain/flight/route";
import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { AircraftRegistration } from "../../domain/shared/aircraft-registration";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";
import { ZonedInstant } from "../../domain/shared/zoned-instant";
import { CardRepository } from "../ports/card-repository";
import { Clock } from "../ports/clock";
import { FlightRepository } from "../ports/flight-repository";
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

class SingleFlightRepository implements FlightRepository {
  constructor(private flight: Flight) {}
  async findByFlightNumberAndDeparture() {
    return this.flight;
  }
  async findById(flightId: string) {
    return flightId === this.flight.id ? this.flight : null;
  }
  async save(flight: Flight) {
    this.flight = flight;
  }
  async appendJourneyEventIfNew() {
    return true;
  }
  async listJourneyEvents() {
    return [];
  }
}

const fixedClock: Clock = { now: () => new Date("2026-07-11T00:00:00Z") };

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

function buildFlight(id: string, flightNumberStr: string, aircraftTypeCode: string | null): Flight {
  const bri = airport("BRI", "LIBD");
  const mxp = airport("MXP", "LIMC");
  const departure = ZonedInstant.fromUtc(new Date("2026-07-10T10:00:00Z"), bri.timeZone);
  const arrival = ZonedInstant.fromUtc(new Date("2026-07-10T12:00:00Z"), mxp.timeZone);

  const assignment = aircraftTypeCode
    ? new AircraftAssignment(
        new Aircraft(
          AircraftRegistration.create("EI-DEA"),
          new AircraftType(aircraftTypeCode, "Airbus", `${aircraftTypeCode} model`, []),
          "AZ",
          null,
        ),
        AssignmentSource.PROVIDER_CONFIRMED,
        AssignmentConfidence.HIGH,
        new Date(),
      )
    : null;

  return new Flight(
    id,
    FlightNumber.create(flightNumberStr),
    new Airline(IataCode.create("AZ"), IcaoAirlineDesignator.create("ITY"), "ITA Airways"),
    new Route(bri, mxp),
    departure,
    arrival,
    FlightPhase.ARRIVED,
    0,
    null,
    departure,
    arrival,
    assignment,
  );
}

describe("UnlockCardsForFlightUseCase", () => {
  let cardRepository: InMemoryCardRepository;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
  });

  it("unlocks a card per new airport, aircraft model, and airline on a first-ever flight", async () => {
    const flight = buildFlight("flight-1", "AZ100", "A20N");
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, new SingleFlightRepository(flight), fixedClock);

    const result = await useCase.execute("user-1", "flight-1");

    expect(result.newAirportCards.map((c) => c.airport.iataCode.toString())).toEqual(["BRI", "MXP"]);
    expect(result.newAircraftCards).toHaveLength(1);
    expect(result.newAirlineCards).toHaveLength(1);
  });

  it("does not create duplicate cards or re-fire unlocks when the same route/aircraft/airline repeats", async () => {
    const flight = buildFlight("flight-1", "AZ100", "A20N");
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, new SingleFlightRepository(flight), fixedClock);

    await useCase.execute("user-1", "flight-1");
    const second = await useCase.execute("user-1", "flight-1");

    expect(second.newAirportCards).toHaveLength(0);
    expect(second.newAircraftCards).toHaveLength(0);
    expect(second.newAirlineCards).toHaveLength(0);
  });

  it("unlocks only the aircraft card when a new aircraft model flies an already-known route/airline", async () => {
    const useCase1FlightRepo = new SingleFlightRepository(buildFlight("flight-1", "AZ100", "A20N"));
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, useCase1FlightRepo, fixedClock);
    await useCase.execute("user-1", "flight-1");

    // Second flight: same BRI/MXP route, same ITA Airways, but a different aircraft model (A321).
    const secondFlightRepo = new SingleFlightRepository(buildFlight("flight-2", "AZ101", "A321"));
    const useCase2 = new UnlockCardsForFlightUseCase(cardRepository, secondFlightRepo, fixedClock);
    const result = await useCase2.execute("user-1", "flight-2");

    expect(result.newAirportCards).toHaveLength(0);
    expect(result.newAirlineCards).toHaveLength(0);
    expect(result.newAircraftCards).toHaveLength(1);
    expect(result.newAircraftCards[0]!.aircraftType.icaoTypeCode).toBe("A321");
  });

  it("gracefully skips aircraft card evaluation when the flight's aircraft was never known", async () => {
    const flight = buildFlight("flight-1", "AZ100", null);
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, new SingleFlightRepository(flight), fixedClock);

    const result = await useCase.execute("user-1", "flight-1");

    expect(result.newAircraftCards).toHaveLength(0);
    expect(cardRepository.aircraftUnlockAttempts).toBe(0);
  });

  it("scopes card ownership per user: two users flying the same flight both unlock their own cards", async () => {
    const flight = buildFlight("flight-1", "AZ100", "A20N");
    const useCase = new UnlockCardsForFlightUseCase(cardRepository, new SingleFlightRepository(flight), fixedClock);

    const userOne = await useCase.execute("user-1", "flight-1");
    const userTwo = await useCase.execute("user-2", "flight-1");

    expect(userOne.newAirlineCards).toHaveLength(1);
    expect(userTwo.newAirlineCards).toHaveLength(1);
  });
});
