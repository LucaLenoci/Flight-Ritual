import { beforeEach, describe, expect, it } from "vitest";
import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { JourneyEvent, JourneyEventType } from "../../domain/flight/journey-event";
import { FlightDataProvider, ProviderFlightSnapshot, ProviderFlightStatus } from "../ports/flight-data-provider";
import { FlightRepository } from "../ports/flight-repository";
import { TrackFlightUseCase } from "./track-flight";

class InMemoryFlightRepository implements FlightRepository {
  private flights = new Map<string, Flight>();
  private events = new Set<string>();
  public allEvents: JourneyEvent[] = [];

  async findByFlightNumberAndDeparture(flightNumber: string, scheduledDepartureUtc: Date) {
    for (const flight of this.flights.values()) {
      if (
        flight.flightNumber.toString() === flightNumber &&
        flight.scheduledDeparture.utcDate.getTime() === scheduledDepartureUtc.getTime()
      ) {
        return flight;
      }
    }
    return null;
  }

  async findById(flightId: string) {
    return this.flights.get(flightId) ?? null;
  }

  async save(flight: Flight) {
    this.flights.set(flight.id, flight);
  }

  async appendJourneyEventIfNew(event: JourneyEvent) {
    if (this.events.has(event.idempotencyKey())) return false;
    this.events.add(event.idempotencyKey());
    this.allEvents.push(event);
    return true;
  }

  async listJourneyEvents(flightId: string) {
    return this.allEvents.filter((e) => e.flightId === flightId);
  }
}

class FakeFlightDataProvider implements FlightDataProvider {
  public nextSnapshot: ProviderFlightSnapshot | null = null;

  async fetchSnapshot(): Promise<ProviderFlightSnapshot | null> {
    return this.nextSnapshot;
  }
}

function snapshot(overrides: Partial<ProviderFlightSnapshot> = {}): ProviderFlightSnapshot {
  return {
    flightNumber: "BA284",
    airline: { iataCode: "BA", icaoDesignator: "BAW", name: "British Airways" },
    origin: {
      iataCode: "LHR",
      icaoCode: "EGLL",
      name: "Heathrow",
      city: "London",
      country: "United Kingdom",
      latitude: 51.47,
      longitude: -0.4543,
      timeZone: "Europe/London",
    },
    destination: {
      iataCode: "JFK",
      icaoCode: "KJFK",
      name: "JFK",
      city: "New York",
      country: "United States",
      latitude: 40.6413,
      longitude: -73.7781,
      timeZone: "America/New_York",
    },
    scheduledDepartureUtc: new Date("2026-07-10T10:00:00Z"),
    scheduledArrivalUtc: new Date("2026-07-10T18:00:00Z"),
    actualDepartureUtc: null,
    actualArrivalUtc: null,
    gate: null,
    delayMinutes: 0,
    status: ProviderFlightStatus.SCHEDULED,
    observedAtUtc: new Date("2026-07-10T08:00:00Z"),
    ...overrides,
  };
}

describe("TrackFlightUseCase", () => {
  let repository: InMemoryFlightRepository;
  let provider: FakeFlightDataProvider;
  let useCase: TrackFlightUseCase;

  beforeEach(() => {
    repository = new InMemoryFlightRepository();
    provider = new FakeFlightDataProvider();
    useCase = new TrackFlightUseCase(provider, repository, () => "flight-1");
  });

  it("starts tracking a new flight and persists it at SCHEDULED phase", async () => {
    provider.nextSnapshot = snapshot();
    const result = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));
    expect(result.flight.phase).toBe(FlightPhase.SCHEDULED);
    expect(result.degraded).toBe(false);
  });

  it("emits a GATE_ASSIGNED event the first time a gate appears, then GATE_CHANGED on a real change", async () => {
    provider.nextSnapshot = snapshot({ gate: "A12" });
    const first = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));
    expect(first.newEvents.map((e) => e.type)).toContain(JourneyEventType.GATE_ASSIGNED);

    provider.nextSnapshot = snapshot({ gate: "A12" });
    const repeat = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));
    expect(repeat.newEvents).toHaveLength(0); // unchanged gate + unchanged delay(0) -> no new events

    provider.nextSnapshot = snapshot({ gate: "B7" });
    const changed = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));
    expect(changed.newEvents.map((e) => e.type)).toContain(JourneyEventType.GATE_CHANGED);
  });

  it("synthesizes intermediate events when a poll finds the flight has jumped several phases ahead", async () => {
    provider.nextSnapshot = snapshot(); // SCHEDULED
    await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    provider.nextSnapshot = snapshot({ status: ProviderFlightStatus.AIRBORNE, actualDepartureUtc: new Date() });
    const result = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    const eventTypes = result.newEvents.map((e) => e.type);
    expect(eventTypes).toContain(JourneyEventType.BOARDING_STARTED);
    expect(eventTypes).toContain(JourneyEventType.DEPARTED);
    expect(eventTypes).toContain(JourneyEventType.TAKEOFF);
    expect(result.flight.phase).toBe(FlightPhase.AIRBORNE);
  });

  it("never creates duplicate events when the same snapshot is polled repeatedly", async () => {
    provider.nextSnapshot = snapshot({ status: ProviderFlightStatus.BOARDING, gate: "A12", delayMinutes: 10 });
    await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));
    await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));
    const secondResult = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    expect(secondResult.newEvents).toHaveLength(0);
    // GATE_ASSIGNED("A12") + DELAY_UPDATED(10) + BOARDING_STARTED, each recorded exactly once
    // despite three identical polls.
    expect(repository.allEvents).toHaveLength(3);
  });

  it("ignores a stale/out-of-order status that would regress the phase, without crashing", async () => {
    provider.nextSnapshot = snapshot({ status: ProviderFlightStatus.AIRBORNE, actualDepartureUtc: new Date() });
    await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    provider.nextSnapshot = snapshot({ status: ProviderFlightStatus.SCHEDULED });
    const result = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    expect(result.flight.phase).toBe(FlightPhase.AIRBORNE);
  });

  it("degrades gracefully by returning last-known state when the provider has no data for an already-tracked flight", async () => {
    provider.nextSnapshot = snapshot();
    await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    provider.nextSnapshot = null;
    const result = await useCase.execute("BA284", new Date("2026-07-10T10:00:00Z"));

    expect(result.degraded).toBe(true);
    expect(result.flight.phase).toBe(FlightPhase.SCHEDULED);
  });
});
