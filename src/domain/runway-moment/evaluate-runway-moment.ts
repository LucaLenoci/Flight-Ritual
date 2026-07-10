import { FlightPhase } from "../flight/flight-phase";
import { RunwayMoment, RunwayMomentPhase } from "./runway-moment";

export interface RunwayMomentContext {
  flightId: string;
  originCity: string;
  destinationCity: string;
  occurredAtUtc: Date;
  delayMinutes: number;
}

/**
 * Pure rule for whether a phase transition deserves a celebratory Runway
 * Moment, and what it should say. Only the transitions into AIRBORNE
 * (takeoff) and LANDED (landing) qualify — every other transition returns
 * null so the caller can skip rendering entirely.
 */
export function evaluateRunwayMoment(
  previousPhase: FlightPhase,
  newPhase: FlightPhase,
  context: RunwayMomentContext,
): RunwayMoment | null {
  if (previousPhase === newPhase) return null;

  if (newPhase === FlightPhase.AIRBORNE) {
    return new RunwayMoment(
      context.flightId,
      RunwayMomentPhase.TAKEOFF,
      context.occurredAtUtc,
      `Wheels up from ${context.originCity}`,
      onTimeSubtext(context.delayMinutes, "departed"),
    );
  }

  if (newPhase === FlightPhase.LANDED) {
    return new RunwayMoment(
      context.flightId,
      RunwayMomentPhase.LANDING,
      context.occurredAtUtc,
      `Touchdown in ${context.destinationCity}`,
      onTimeSubtext(context.delayMinutes, "arrived"),
    );
  }

  return null;
}

function onTimeSubtext(delayMinutes: number, verb: string): string {
  if (delayMinutes <= 0) return `Right on schedule.`;
  return `${verb === "departed" ? "Departed" : "Arrived"} ${delayMinutes} min behind schedule.`;
}
