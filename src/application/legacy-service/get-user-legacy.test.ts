import { describe, expect, it } from "vitest";
import { FlightMemory, FlightMemorySnapshot } from "../../domain/legacy/flight-memory";
import { LegacyRepository } from "../ports/legacy-repository";
import { GetUserLegacyUseCase } from "./get-user-legacy";

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

class InMemoryLegacyRepository implements LegacyRepository {
  constructor(private memories: FlightMemory[]) {}
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

describe("GetUserLegacyUseCase (authorization boundary)", () => {
  it("never returns another user's flight memories", async () => {
    const memories = [
      new FlightMemory("mem-1", "user-1", "flight-1", new Date(), null, snapshot()),
      new FlightMemory("mem-2", "user-2", "flight-2", new Date(), null, snapshot({ flightNumber: "AF447" })),
    ];
    const useCase = new GetUserLegacyUseCase(new InMemoryLegacyRepository(memories));

    const user1View = await useCase.execute("user-1");
    expect(user1View.memories).toHaveLength(1);
    expect(user1View.memories[0]!.id).toBe("mem-1");

    const user2View = await useCase.execute("user-2");
    expect(user2View.memories).toHaveLength(1);
    expect(user2View.memories[0]!.id).toBe("mem-2");
  });

  it("returns empty stats/collection for a user with no saved flights", async () => {
    const useCase = new GetUserLegacyUseCase(new InMemoryLegacyRepository([]));
    const view = await useCase.execute("user-with-no-flights");
    expect(view.stats.totalFlights).toBe(0);
    expect(view.collection.airportIataCodes.size).toBe(0);
  });
});
