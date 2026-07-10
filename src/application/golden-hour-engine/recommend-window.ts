import { Flight } from "../../domain/flight/flight";
import { evaluateWindowRecommendation } from "../../domain/golden-hour/evaluate-window-recommendation";
import {
  RecommendationConfidence,
  WindowRecommendation,
  WindowSide,
} from "../../domain/golden-hour/window-recommendation";
import { calculateSolarPosition } from "./sun-position-calculator";

// How finely we sample along the flight to find the best golden-hour moment.
// 5 minutes balances precision against sample count for long-haul flights.
const SAMPLE_INTERVAL_MINUTES = 5;
// Upper bound on samples so a very long flight (e.g. 18h ultra-long-haul)
// still finishes in a bounded number of iterations.
const MAX_SAMPLES = 240;
const MIN_SAMPLES = 2;

const CONFIDENCE_RANK: Record<RecommendationConfidence, number> = {
  [RecommendationConfidence.HIGH]: 2,
  [RecommendationConfidence.MEDIUM]: 1,
  [RecommendationConfidence.LOW]: 0,
};

/**
 * Golden Hour / Window Recommendation Engine: samples sun position at
 * regular intervals along a flight's great-circle route and picks the best
 * golden-hour moment, if any exists during the flight. Pure orchestration —
 * all business rules (what counts as "good") live in the domain function
 * this composes with the sun-position adapter.
 */
export class RecommendWindowUseCase {
  execute(flight: Flight): WindowRecommendation {
    const durationMinutes = flight.scheduledDurationMinutes();
    if (durationMinutes <= 0) {
      return WindowRecommendation.notApplicable("Flight duration is unavailable.");
    }

    const sampleCount = Math.min(
      MAX_SAMPLES,
      Math.max(MIN_SAMPLES, Math.floor(durationMinutes / SAMPLE_INTERVAL_MINUTES)),
    );

    let best: WindowRecommendation | null = null;
    for (let i = 0; i <= sampleCount; i++) {
      const fraction = i / sampleCount;
      const instantUtc = new Date(
        flight.scheduledDeparture.utcDate.getTime() + fraction * durationMinutes * 60_000,
      );
      const position = flight.route.interpolatePosition(fraction);
      const headingDeg = flight.route.bearingFrom(position);
      const sun = calculateSolarPosition(instantUtc, position.latitude, position.longitude);

      const candidate = evaluateWindowRecommendation({
        sunAzimuthDeg: sun.azimuthDeg,
        sunElevationDeg: sun.elevationDeg,
        aircraftHeadingDeg: headingDeg,
        observedAtUtc: instantUtc,
      });

      if (isBetterRecommendation(candidate, best)) best = candidate;
    }

    return best ?? WindowRecommendation.notApplicable("No golden-hour window occurs during this flight.");
  }
}

function isBetterRecommendation(candidate: WindowRecommendation, current: WindowRecommendation | null): boolean {
  if (candidate.side === WindowSide.NOT_APPLICABLE) return false;
  if (!current || current.side === WindowSide.NOT_APPLICABLE) return true;
  return CONFIDENCE_RANK[candidate.confidence] > CONFIDENCE_RANK[current.confidence];
}
