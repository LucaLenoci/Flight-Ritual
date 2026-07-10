import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError } from "../shared/errors";
import { FlightPhase } from "./flight-phase";
import { JourneyEventType } from "./journey-event";
import { applyJourneyEvent, synthesizeForwardEventTypes } from "./journey-state-machine";

describe("applyJourneyEvent", () => {
  it("walks a flight through its full normal journey, one step at a time", () => {
    let phase = FlightPhase.SCHEDULED;
    phase = applyJourneyEvent(phase, JourneyEventType.BOARDING_STARTED);
    expect(phase).toBe(FlightPhase.BOARDING);
    phase = applyJourneyEvent(phase, JourneyEventType.DEPARTED);
    expect(phase).toBe(FlightPhase.DEPARTED);
    phase = applyJourneyEvent(phase, JourneyEventType.TAKEOFF);
    expect(phase).toBe(FlightPhase.AIRBORNE);
    phase = applyJourneyEvent(phase, JourneyEventType.DESCENT_STARTED);
    expect(phase).toBe(FlightPhase.DESCENDING);
    phase = applyJourneyEvent(phase, JourneyEventType.LANDED);
    expect(phase).toBe(FlightPhase.LANDED);
    phase = applyJourneyEvent(phase, JourneyEventType.ARRIVED_AT_GATE);
    expect(phase).toBe(FlightPhase.ARRIVED);
  });

  it("treats phase-neutral events (gate/delay updates, cruise) as no-ops", () => {
    expect(applyJourneyEvent(FlightPhase.SCHEDULED, JourneyEventType.GATE_ASSIGNED)).toBe(
      FlightPhase.SCHEDULED,
    );
    expect(applyJourneyEvent(FlightPhase.AIRBORNE, JourneyEventType.DELAY_UPDATED)).toBe(
      FlightPhase.AIRBORNE,
    );
    expect(applyJourneyEvent(FlightPhase.AIRBORNE, JourneyEventType.CRUISE_REACHED)).toBe(
      FlightPhase.AIRBORNE,
    );
  });

  it("re-applying the same phase-advancing event is idempotent, not an error", () => {
    const phase = applyJourneyEvent(FlightPhase.AIRBORNE, JourneyEventType.TAKEOFF);
    expect(phase).toBe(FlightPhase.AIRBORNE);
  });

  it("rejects skipping ahead (e.g. straight from SCHEDULED to AIRBORNE)", () => {
    expect(() => applyJourneyEvent(FlightPhase.SCHEDULED, JourneyEventType.TAKEOFF)).toThrow(
      IllegalStateTransitionError,
    );
  });

  it("rejects regressive/out-of-order events (e.g. boarding after landing)", () => {
    expect(() => applyJourneyEvent(FlightPhase.LANDED, JourneyEventType.BOARDING_STARTED)).toThrow(
      IllegalStateTransitionError,
    );
  });

  it("rejects phase-changing events once a flight is in a terminal state", () => {
    expect(() => applyJourneyEvent(FlightPhase.ARRIVED, JourneyEventType.TAKEOFF)).toThrow(
      IllegalStateTransitionError,
    );
    expect(() => applyJourneyEvent(FlightPhase.CANCELLED, JourneyEventType.BOARDING_STARTED)).toThrow(
      IllegalStateTransitionError,
    );
  });

  it("harmlessly no-ops phase-neutral events (e.g. a trailing gate update) even in a terminal state", () => {
    expect(applyJourneyEvent(FlightPhase.ARRIVED, JourneyEventType.GATE_CHANGED)).toBe(FlightPhase.ARRIVED);
  });

  it("allows cancellation only before departure", () => {
    expect(applyJourneyEvent(FlightPhase.SCHEDULED, JourneyEventType.CANCELLED)).toBe(
      FlightPhase.CANCELLED,
    );
    expect(applyJourneyEvent(FlightPhase.BOARDING, JourneyEventType.CANCELLED)).toBe(
      FlightPhase.CANCELLED,
    );
    expect(() => applyJourneyEvent(FlightPhase.AIRBORNE, JourneyEventType.CANCELLED)).toThrow(
      IllegalStateTransitionError,
    );
  });

  it("allows diversion only while airborne or descending", () => {
    expect(applyJourneyEvent(FlightPhase.AIRBORNE, JourneyEventType.DIVERTED)).toBe(
      FlightPhase.DIVERTED,
    );
    expect(applyJourneyEvent(FlightPhase.DESCENDING, JourneyEventType.DIVERTED)).toBe(
      FlightPhase.DIVERTED,
    );
    expect(() => applyJourneyEvent(FlightPhase.SCHEDULED, JourneyEventType.DIVERTED)).toThrow(
      IllegalStateTransitionError,
    );
  });
});

describe("synthesizeForwardEventTypes", () => {
  it("fills in every intermediate event when a poll jumps several phases ahead", () => {
    const events = synthesizeForwardEventTypes(FlightPhase.SCHEDULED, FlightPhase.AIRBORNE);
    expect(events).toEqual([
      JourneyEventType.BOARDING_STARTED,
      JourneyEventType.DEPARTED,
      JourneyEventType.TAKEOFF,
    ]);
  });

  it("returns a single event for a normal one-step advance", () => {
    expect(synthesizeForwardEventTypes(FlightPhase.DEPARTED, FlightPhase.AIRBORNE)).toEqual([
      JourneyEventType.TAKEOFF,
    ]);
  });

  it("returns an empty list for stale/out-of-order data (target not ahead of current)", () => {
    expect(synthesizeForwardEventTypes(FlightPhase.AIRBORNE, FlightPhase.BOARDING)).toEqual([]);
    expect(synthesizeForwardEventTypes(FlightPhase.AIRBORNE, FlightPhase.AIRBORNE)).toEqual([]);
  });

  it("applying the synthesized events in order actually reaches the target phase", () => {
    const events = synthesizeForwardEventTypes(FlightPhase.SCHEDULED, FlightPhase.ARRIVED);
    let phase = FlightPhase.SCHEDULED;
    for (const eventType of events) {
      phase = applyJourneyEvent(phase, eventType);
    }
    expect(phase).toBe(FlightPhase.ARRIVED);
  });
});
