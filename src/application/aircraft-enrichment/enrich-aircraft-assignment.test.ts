import { describe, expect, it } from "vitest";
import { AssignmentConfidence, AssignmentSource } from "../../domain/aircraft/aircraft-assignment";
import { Clock } from "../ports/clock";
import {
  AircraftDataProvider,
  AircraftDataProviderError,
  ProviderAircraftDetails,
} from "../ports/aircraft-data-provider";
import { EnrichAircraftAssignmentUseCase } from "./enrich-aircraft-assignment";

const FIXED_NOW = new Date("2026-07-10T12:00:00Z");
const fixedClock: Clock = { now: () => FIXED_NOW };

const aircraftDetails: ProviderAircraftDetails = {
  registration: "G-STBA",
  type: { icaoTypeCode: "B77W", manufacturer: "Boeing", model: "777-300ER", facts: ["Twin-engine widebody"] },
  operatorIataCode: "BA",
  manufactureDate: new Date("2010-05-01T00:00:00Z"),
};

class StubProvider implements AircraftDataProvider {
  constructor(
    private readonly confirmed: ProviderAircraftDetails | null | (() => Promise<ProviderAircraftDetails | null>),
    private readonly historical: ProviderAircraftDetails | null | (() => Promise<ProviderAircraftDetails | null>) = null,
  ) {}

  async fetchConfirmedAssignment(): Promise<ProviderAircraftDetails | null> {
    return typeof this.confirmed === "function" ? this.confirmed() : this.confirmed;
  }

  async fetchHistoricalPattern(): Promise<ProviderAircraftDetails | null> {
    return typeof this.historical === "function" ? this.historical() : this.historical;
  }
}

describe("EnrichAircraftAssignmentUseCase", () => {
  it("prefers a live-confirmed assignment with HIGH confidence", async () => {
    const useCase = new EnrichAircraftAssignmentUseCase(new StubProvider(aircraftDetails), fixedClock);
    const result = await useCase.execute("BA284", new Date());
    expect(result?.source).toBe(AssignmentSource.PROVIDER_CONFIRMED);
    expect(result?.confidence).toBe(AssignmentConfidence.HIGH);
    expect(result?.aircraft.registration.toString()).toBe("G-STBA");
  });

  it("falls back to the historical pattern when no live confirmation exists", async () => {
    const useCase = new EnrichAircraftAssignmentUseCase(new StubProvider(null, aircraftDetails), fixedClock);
    const result = await useCase.execute("BA284", new Date());
    expect(result?.source).toBe(AssignmentSource.HISTORICAL_PATTERN);
    expect(result?.confidence).toBe(AssignmentConfidence.LOW);
  });

  it("returns null (not a thrown error) when neither source has any data", async () => {
    const useCase = new EnrichAircraftAssignmentUseCase(new StubProvider(null, null), fixedClock);
    const result = await useCase.execute("BA284", new Date());
    expect(result).toBeNull();
  });

  it("falls back to history when the live confirmation call fails transiently", async () => {
    const useCase = new EnrichAircraftAssignmentUseCase(
      new StubProvider(() => {
        throw new AircraftDataProviderError("timeout");
      }, aircraftDetails),
      fixedClock,
    );
    const result = await useCase.execute("BA284", new Date());
    expect(result?.source).toBe(AssignmentSource.HISTORICAL_PATTERN);
  });

  it("degrades to null when both sources fail transiently, instead of throwing", async () => {
    const failing = () => {
      throw new AircraftDataProviderError("timeout");
    };
    const useCase = new EnrichAircraftAssignmentUseCase(new StubProvider(failing, failing), fixedClock);
    await expect(useCase.execute("BA284", new Date())).resolves.toBeNull();
  });

  it("lets an unexpected (non-provider) error propagate rather than silently swallowing it", async () => {
    const useCase = new EnrichAircraftAssignmentUseCase(
      new StubProvider(() => {
        throw new Error("unexpected bug");
      }),
      fixedClock,
    );
    await expect(useCase.execute("BA284", new Date())).rejects.toThrow("unexpected bug");
  });
});
