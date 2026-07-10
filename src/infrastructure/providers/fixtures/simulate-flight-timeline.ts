import { ProviderFlightSnapshot, ProviderFlightStatus } from "../../../application/ports/flight-data-provider";
import { FlightFixtureDefinition } from "./flight-fixtures";

// How long before scheduled departure the gate becomes known / boarding opens.
// These are simulation constants, not domain rules — a real provider would
// simply report these facts rather than us needing to derive them.
const GATE_REVEAL_LEAD_MINUTES = 90;
const BOARDING_LEAD_MINUTES = 40;
const TAXI_OUT_MINUTES = 15;
const TAXI_IN_MINUTES = 8;
const DESCENT_LEAD_MINUTES = 30;

export interface ResolvedFixture {
  definition: FlightFixtureDefinition;
  scheduledDepartureUtc: Date;
  scheduledArrivalUtc: Date;
}

export function resolveFixture(definition: FlightFixtureDefinition, anchorUtc: Date): ResolvedFixture {
  const scheduledDepartureUtc = addMinutes(anchorUtc, definition.departureOffsetMinutes);
  const scheduledArrivalUtc = addMinutes(scheduledDepartureUtc, definition.scheduledDurationMinutes);
  return { definition, scheduledDepartureUtc, scheduledArrivalUtc };
}

/** Derives a live-feeling snapshot for a resolved fixture at a given moment, simulating the journey's natural progression. */
export function simulateSnapshot(resolved: ResolvedFixture, nowUtc: Date): ProviderFlightSnapshot {
  const { definition, scheduledDepartureUtc, scheduledArrivalUtc } = resolved;

  const gateRevealAt = addMinutes(scheduledDepartureUtc, -GATE_REVEAL_LEAD_MINUTES);
  const boardingAt = addMinutes(scheduledDepartureUtc, -BOARDING_LEAD_MINUTES);
  const actualDepartureUtc = addMinutes(scheduledDepartureUtc, definition.delayMinutes);
  const actualArrivalUtc = addMinutes(scheduledArrivalUtc, definition.delayMinutes);
  const takeoffAt = addMinutes(actualDepartureUtc, TAXI_OUT_MINUTES);
  const landedAt = addMinutes(actualArrivalUtc, -TAXI_IN_MINUTES);
  const descentAt = addMinutes(landedAt, -DESCENT_LEAD_MINUTES);

  const gate = nowUtc >= gateRevealAt ? definition.gate : null;

  let status: ProviderFlightStatus;
  let reportedActualDeparture: Date | null = null;
  let reportedActualArrival: Date | null = null;

  if (nowUtc < boardingAt) {
    status = ProviderFlightStatus.SCHEDULED;
  } else if (nowUtc < actualDepartureUtc) {
    status = ProviderFlightStatus.BOARDING;
  } else if (nowUtc < takeoffAt) {
    status = ProviderFlightStatus.DEPARTED;
    reportedActualDeparture = actualDepartureUtc;
  } else if (nowUtc < descentAt) {
    status = ProviderFlightStatus.AIRBORNE;
    reportedActualDeparture = actualDepartureUtc;
  } else if (nowUtc < landedAt) {
    status = ProviderFlightStatus.DESCENDING;
    reportedActualDeparture = actualDepartureUtc;
  } else if (nowUtc < actualArrivalUtc) {
    status = ProviderFlightStatus.LANDED;
    reportedActualDeparture = actualDepartureUtc;
    reportedActualArrival = landedAt;
  } else {
    status = ProviderFlightStatus.ARRIVED;
    reportedActualDeparture = actualDepartureUtc;
    reportedActualArrival = actualArrivalUtc;
  }

  return {
    flightNumber: definition.flightNumber,
    airline: definition.airline,
    origin: definition.origin,
    destination: definition.destination,
    scheduledDepartureUtc,
    scheduledArrivalUtc,
    actualDepartureUtc: reportedActualDeparture,
    actualArrivalUtc: reportedActualArrival,
    gate,
    delayMinutes: nowUtc >= boardingAt ? definition.delayMinutes : 0,
    status,
    observedAtUtc: nowUtc,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}
