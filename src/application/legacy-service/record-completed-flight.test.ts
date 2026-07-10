import { beforeEach, describe, expect, it } from "vitest";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { Route } from "../../domain/flight/route";
import { FlightMemory } from "../../domain/legacy/flight-memory";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";
import { ZonedInstant } from "../../domain/shared/zoned-instant";
import { FlightNotEligibleForLegacyError, FlightNotFoundByIdError } from "../errors";
import { Clock } from "../ports/clock";
import { FlightRepository } from "../ports/flight-repository";
import { LegacyRepository } from "../ports/legacy-repository";
import { RecordCompletedFlightUseCase } from "./record-completed-flight";

class InMemoryFlightRepository implements FlightRepository {
  constructor(private flight: Flight | null) {}
  async findByFlightNumberAndDeparture() {
    return this.flight;
  }
  async findById(flightId: string) {
    return this.flight && this.flight.id === flightId ? this.flight : null;
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

class InMemoryLegacyRepository implements LegacyRepository {
  private memories: FlightMemory[] = [];
  async listForUser(userId: string) {
    return this.memories.filter((m) => m.userId === userId);
  }
  async findByUserAndFlight(userId: string, flightId: string) {
    return this.memories.find((m) => m.userId === userId && m.flightId === flightId) ?? null;
  }
  async save(memory: FlightMemory) {
    this.memories.push(memory);
  }
}

function buildFlight(phase: FlightPhase): Flight {
  const lhr = new Airport(
    IataCode.create("LHR"),
    IcaoAirportCode.create("EGLL"),
    "Heathrow",
    "London",
    "United Kingdom",
    Coordinates.create(51.47, -0.4543),
    "Europe/London",
  );
  const jfk = new Airport(
    IataCode.create("JFK"),
    IcaoAirportCode.create("KJFK"),
    "JFK",
    "New York",
    "United States",
    Coordinates.create(40.6413, -73.7781),
    "America/New_York",
  );
  const departure = ZonedInstant.fromUtc(new Date("2026-07-10T10:00:00Z"), lhr.timeZone);
  const arrival = ZonedInstant.fromUtc(new Date("2026-07-10T18:00:00Z"), jfk.timeZone);
  return new Flight(
    "flight-1",
    FlightNumber.create("BA284"),
    new Airline(IataCode.create("BA"), IcaoAirlineDesignator.create("BAW"), "British Airways"),
    new Route(lhr, jfk),
    departure,
    arrival,
    phase,
    0,
    null,
    phase === FlightPhase.ARRIVED ? departure : null,
    phase === FlightPhase.ARRIVED ? arrival : null,
    null,
  );
}

const fixedClock: Clock = { now: () => new Date("2026-07-11T00:00:00Z") };

describe("RecordCompletedFlightUseCase", () => {
  let flightRepository: InMemoryFlightRepository;
  let legacyRepository: InMemoryLegacyRepository;
  let useCase: RecordCompletedFlightUseCase;
  let idCounter: number;

  beforeEach(() => {
    idCounter = 0;
    legacyRepository = new InMemoryLegacyRepository();
    useCase = undefined as unknown as RecordCompletedFlightUseCase;
  });

  function setup(flight: Flight | null) {
    flightRepository = new InMemoryFlightRepository(flight);
    useCase = new RecordCompletedFlightUseCase(flightRepository, legacyRepository, fixedClock, () => `mem-${++idCounter}`);
  }

  it("saves an arrived flight to the user's legacy log", async () => {
    setup(buildFlight(FlightPhase.ARRIVED));
    const memory = await useCase.execute("user-1", "flight-1");
    expect(memory.userId).toBe("user-1");
    expect(memory.snapshot.flightNumber).toBe("BA284");
    expect(memory.snapshot.distanceKm).toBeGreaterThan(0);
  });

  it("rejects saving a flight that hasn't arrived yet", async () => {
    setup(buildFlight(FlightPhase.AIRBORNE));
    await expect(useCase.execute("user-1", "flight-1")).rejects.toThrow(FlightNotEligibleForLegacyError);
  });

  it("rejects saving a flight that doesn't exist", async () => {
    setup(null);
    await expect(useCase.execute("user-1", "does-not-exist")).rejects.toThrow(FlightNotFoundByIdError);
  });

  it("is idempotent: saving the same flight twice returns the original memory, not a duplicate", async () => {
    setup(buildFlight(FlightPhase.ARRIVED));
    const first = await useCase.execute("user-1", "flight-1");
    const second = await useCase.execute("user-1", "flight-1");
    expect(second.id).toBe(first.id);
    const all = await legacyRepository.listForUser("user-1");
    expect(all).toHaveLength(1);
  });

  it("lets two different users independently save the same real-world flight", async () => {
    setup(buildFlight(FlightPhase.ARRIVED));
    await useCase.execute("user-1", "flight-1");
    await useCase.execute("user-2", "flight-1");
    expect(await legacyRepository.listForUser("user-1")).toHaveLength(1);
    expect(await legacyRepository.listForUser("user-2")).toHaveLength(1);
  });
});
