import { describe, expect, it } from "vitest";
import { JourneyEvent, JourneyEventType } from "./journey-event";

describe("JourneyEvent idempotency", () => {
  it("gives singleton event types (e.g. TAKEOFF) a constant sequence key, so re-ingestion collides on identity", () => {
    const first = JourneyEvent.create("flight-1", JourneyEventType.TAKEOFF, new Date("2026-07-10T10:00:00Z"));
    const second = JourneyEvent.create("flight-1", JourneyEventType.TAKEOFF, new Date("2026-07-10T10:00:05Z"));
    expect(first.idempotencyKey()).toBe(second.idempotencyKey());
  });

  it("gives repeated gate changes to the same gate the same key (no duplicate), but a genuine change a new key", () => {
    const unchanged1 = JourneyEvent.create("flight-1", JourneyEventType.GATE_CHANGED, new Date(), {
      gate: "A12",
    });
    const unchanged2 = JourneyEvent.create("flight-1", JourneyEventType.GATE_CHANGED, new Date(), {
      gate: "A12",
    });
    const changed = JourneyEvent.create("flight-1", JourneyEventType.GATE_CHANGED, new Date(), {
      gate: "B7",
    });

    expect(unchanged1.idempotencyKey()).toBe(unchanged2.idempotencyKey());
    expect(unchanged1.idempotencyKey()).not.toBe(changed.idempotencyKey());
  });

  it("gives repeated delay updates with the same value the same key, but a new delay value a new key", () => {
    const first = JourneyEvent.create("flight-1", JourneyEventType.DELAY_UPDATED, new Date(), {
      delayMinutes: 15,
    });
    const same = JourneyEvent.create("flight-1", JourneyEventType.DELAY_UPDATED, new Date(), {
      delayMinutes: 15,
    });
    const escalated = JourneyEvent.create("flight-1", JourneyEventType.DELAY_UPDATED, new Date(), {
      delayMinutes: 45,
    });

    expect(first.idempotencyKey()).toBe(same.idempotencyKey());
    expect(first.idempotencyKey()).not.toBe(escalated.idempotencyKey());
  });

  it("scopes identity per flight, so the same event type on a different flight never collides", () => {
    const flightA = JourneyEvent.create("flight-A", JourneyEventType.LANDED, new Date());
    const flightB = JourneyEvent.create("flight-B", JourneyEventType.LANDED, new Date());
    expect(flightA.idempotencyKey()).not.toBe(flightB.idempotencyKey());
  });
});
