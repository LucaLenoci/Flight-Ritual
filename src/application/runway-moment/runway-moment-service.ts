import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { evaluateRunwayMoment } from "../../domain/runway-moment/evaluate-runway-moment";
import { RunwayMoment } from "../../domain/runway-moment/runway-moment";

/**
 * Thin application wrapper around the domain's evaluateRunwayMoment rule,
 * pulling the display context (city names, delay) off the Flight aggregate.
 * Called by the journey-engine's caller once per newly detected phase
 * transition — never on phase-neutral events — so a Runway Moment fires
 * at most once per takeoff and once per landing.
 */
export class RunwayMomentService {
  forTransition(previousPhase: FlightPhase, flight: Flight): RunwayMoment | null {
    return evaluateRunwayMoment(previousPhase, flight.phase, {
      flightId: flight.id,
      originCity: flight.route.origin.city,
      destinationCity: flight.route.destination.city,
      occurredAtUtc: flight.actualDeparture?.utcDate ?? flight.actualArrival?.utcDate ?? new Date(),
      delayMinutes: flight.delayMinutes,
    });
  }
}
