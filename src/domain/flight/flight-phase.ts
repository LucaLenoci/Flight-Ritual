/** The coarse-grained phase of a flight's journey, used to drive UI state and Runway Moments. */
export enum FlightPhase {
  SCHEDULED = "SCHEDULED",
  BOARDING = "BOARDING",
  DEPARTED = "DEPARTED",
  AIRBORNE = "AIRBORNE",
  DESCENDING = "DESCENDING",
  LANDED = "LANDED",
  ARRIVED = "ARRIVED",
  CANCELLED = "CANCELLED",
  DIVERTED = "DIVERTED",
}

/**
 * Ordering used to reject out-of-order phase regressions (e.g. a late-arriving
 * "boarding started" event after we've already recorded takeoff). CANCELLED
 * and DIVERTED are absorbing terminal states handled separately, not ranked.
 */
export const FLIGHT_PHASE_RANK: Record<FlightPhase, number> = {
  [FlightPhase.SCHEDULED]: 0,
  [FlightPhase.BOARDING]: 1,
  [FlightPhase.DEPARTED]: 2,
  [FlightPhase.AIRBORNE]: 3,
  [FlightPhase.DESCENDING]: 4,
  [FlightPhase.LANDED]: 5,
  [FlightPhase.ARRIVED]: 6,
  [FlightPhase.CANCELLED]: -1,
  [FlightPhase.DIVERTED]: -1,
};

export function isTerminalPhase(phase: FlightPhase): boolean {
  return (
    phase === FlightPhase.ARRIVED || phase === FlightPhase.CANCELLED || phase === FlightPhase.DIVERTED
  );
}
