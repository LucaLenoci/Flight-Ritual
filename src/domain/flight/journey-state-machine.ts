import { IllegalStateTransitionError } from "../shared/errors";
import { FLIGHT_PHASE_RANK, FlightPhase, isTerminalPhase } from "./flight-phase";
import { JourneyEventType } from "./journey-event";

/** Event types that carry information but never change the flight's phase. */
const PHASE_NEUTRAL_EVENTS: ReadonlySet<JourneyEventType> = new Set([
  JourneyEventType.SCHEDULED,
  JourneyEventType.GATE_ASSIGNED,
  JourneyEventType.GATE_CHANGED,
  JourneyEventType.DELAY_UPDATED,
  JourneyEventType.CRUISE_REACHED,
]);

/** Phase each phase-changing event drives the flight into. */
const EVENT_TARGET_PHASE: Partial<Record<JourneyEventType, FlightPhase>> = {
  [JourneyEventType.BOARDING_STARTED]: FlightPhase.BOARDING,
  [JourneyEventType.DEPARTED]: FlightPhase.DEPARTED,
  [JourneyEventType.TAKEOFF]: FlightPhase.AIRBORNE,
  [JourneyEventType.DESCENT_STARTED]: FlightPhase.DESCENDING,
  [JourneyEventType.LANDED]: FlightPhase.LANDED,
  [JourneyEventType.ARRIVED_AT_GATE]: FlightPhase.ARRIVED,
  [JourneyEventType.CANCELLED]: FlightPhase.CANCELLED,
  [JourneyEventType.DIVERTED]: FlightPhase.DIVERTED,
};

/** Phases from which cancellation is still a meaningful, allowed transition. */
const CANCELLABLE_FROM: ReadonlySet<FlightPhase> = new Set([
  FlightPhase.SCHEDULED,
  FlightPhase.BOARDING,
]);

/** Phases from which a diversion can be declared. */
const DIVERTABLE_FROM: ReadonlySet<FlightPhase> = new Set([
  FlightPhase.AIRBORNE,
  FlightPhase.DESCENDING,
]);

/**
 * Pure state-transition function for a flight's journey. Given the current
 * phase and an incoming event, returns the next phase — or throws if the
 * transition is illegal (out-of-order, regressive, or from a terminal state).
 *
 * Phase-neutral events (gate/delay updates) are always accepted and return
 * the current phase unchanged, since they carry information without moving
 * the journey forward.
 */
export function applyJourneyEvent(currentPhase: FlightPhase, eventType: JourneyEventType): FlightPhase {
  if (PHASE_NEUTRAL_EVENTS.has(eventType)) {
    return currentPhase;
  }

  if (isTerminalPhase(currentPhase)) {
    throw new IllegalStateTransitionError("Flight", currentPhase, eventType);
  }

  if (eventType === JourneyEventType.CANCELLED) {
    if (!CANCELLABLE_FROM.has(currentPhase)) {
      throw new IllegalStateTransitionError("Flight", currentPhase, eventType);
    }
    return FlightPhase.CANCELLED;
  }

  if (eventType === JourneyEventType.DIVERTED) {
    if (!DIVERTABLE_FROM.has(currentPhase)) {
      throw new IllegalStateTransitionError("Flight", currentPhase, eventType);
    }
    return FlightPhase.DIVERTED;
  }

  const targetPhase = EVENT_TARGET_PHASE[eventType];
  if (!targetPhase) {
    throw new IllegalStateTransitionError("Flight", currentPhase, eventType);
  }

  const currentRank = FLIGHT_PHASE_RANK[currentPhase];
  const targetRank = FLIGHT_PHASE_RANK[targetPhase];

  // Idempotent no-op: re-processing an event we've already applied.
  if (targetRank === currentRank) {
    return currentPhase;
  }

  // Reject regressions and skipped-backwards events; only strictly-forward,
  // one-step-at-a-time progress is a legal transition.
  if (targetRank !== currentRank + 1) {
    throw new IllegalStateTransitionError("Flight", currentPhase, eventType);
  }

  return targetPhase;
}

/**
 * The normal-flow phases in forward order (excludes the absorbing terminal
 * states CANCELLED/DIVERTED, which can be entered from several phases and
 * aren't part of a single sequence). Exposed so callers — e.g. the journey
 * engine synthesizing catch-up events after a missed poll — can walk the
 * sequence without duplicating the ordering already encoded here.
 */
export const ORDERED_NORMAL_PHASES: readonly FlightPhase[] = [
  FlightPhase.SCHEDULED,
  FlightPhase.BOARDING,
  FlightPhase.DEPARTED,
  FlightPhase.AIRBORNE,
  FlightPhase.DESCENDING,
  FlightPhase.LANDED,
  FlightPhase.ARRIVED,
];

/** The event type that drives a flight *into* the given phase, if any (inverse of EVENT_TARGET_PHASE). */
export function eventTypeThatEntersPhase(phase: FlightPhase): JourneyEventType | null {
  for (const [eventType, targetPhase] of Object.entries(EVENT_TARGET_PHASE)) {
    if (targetPhase === phase) return eventType as JourneyEventType;
  }
  return null;
}

/**
 * When a provider poll jumps straight from one phase to a later one (a
 * missed intermediate poll, or a slow-to-update provider), this synthesizes
 * the sequence of intermediate events needed to walk forward one step at a
 * time, so no journey history is lost. Returns an empty array if the target
 * isn't strictly ahead of the current phase (stale/out-of-order data, or a
 * terminal target that isn't part of the normal forward sequence) — callers
 * handle CANCELLED/DIVERTED as a single direct transition instead.
 */
export function synthesizeForwardEventTypes(
  currentPhase: FlightPhase,
  targetPhase: FlightPhase,
): JourneyEventType[] {
  const currentRank = FLIGHT_PHASE_RANK[currentPhase];
  const targetRank = FLIGHT_PHASE_RANK[targetPhase];
  if (currentRank < 0 || targetRank < 0 || targetRank <= currentRank) return [];

  const eventTypes: JourneyEventType[] = [];
  for (const phase of ORDERED_NORMAL_PHASES) {
    const rank = FLIGHT_PHASE_RANK[phase];
    if (rank > currentRank && rank <= targetRank) {
      const eventType = eventTypeThatEntersPhase(phase);
      if (eventType) eventTypes.push(eventType);
    }
  }
  return eventTypes;
}
