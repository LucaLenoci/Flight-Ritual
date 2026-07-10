import { RecommendationConfidence, WindowRecommendation, WindowSide } from "./window-recommendation";

// Golden hour is conventionally the period when the sun sits low on the
// horizon, producing warm, soft, directional light. -4deg (just below the
// horizon, still lit by refraction/scatter) to +6deg (sun clearly above the
// horizon but still low) is the commonly used photographic golden-hour band.
export const GOLDEN_HOUR_MIN_ELEVATION_DEG = -4;
export const GOLDEN_HOUR_MAX_ELEVATION_DEG = 6;

// Within this many degrees of dead-ahead or dead-astern, the sun is roughly
// equally visible from both sides of the cabin, so we don't force a side.
const NOSE_TAIL_DEADZONE_DEG = 20;

// How far inside the golden-hour band the sun must sit (away from either
// edge) to call the recommendation HIGH confidence rather than MEDIUM.
const HIGH_CONFIDENCE_MARGIN_DEG = 2;

export interface SunObservation {
  /** Compass bearing (0-360, clockwise from true north) the sun sits at. */
  sunAzimuthDeg: number;
  /** Sun elevation above the horizon in degrees; negative values are below the horizon. */
  sunElevationDeg: number;
  /** Aircraft's compass heading (0-360) at the moment of observation. */
  aircraftHeadingDeg: number;
  observedAtUtc: Date;
}

/**
 * Pure domain rule: given the sun's position and the aircraft's heading at a
 * single instant, decide which side of the cabin has the best golden-hour
 * view, if any. No I/O, no astronomical math here — that lives upstream in
 * the application layer's solar position calculator; this function only
 * encodes the *business rule* of what counts as a good window moment.
 */
export function evaluateWindowRecommendation(observation: SunObservation): WindowRecommendation {
  const { sunAzimuthDeg, sunElevationDeg, aircraftHeadingDeg, observedAtUtc } = observation;

  if (sunElevationDeg < GOLDEN_HOUR_MIN_ELEVATION_DEG || sunElevationDeg > GOLDEN_HOUR_MAX_ELEVATION_DEG) {
    return WindowRecommendation.notApplicable(
      sunElevationDeg > GOLDEN_HOUR_MAX_ELEVATION_DEG
        ? "Sun is too high for golden-hour light at this point in the flight."
        : "Sun is below the horizon; no golden-hour light at this point in the flight.",
    );
  }

  const relativeBearing = normalizeDegrees(sunAzimuthDeg - aircraftHeadingDeg);
  const distanceFromNoseOrTail = Math.min(relativeBearing, 360 - relativeBearing, Math.abs(relativeBearing - 180));

  const distanceFromBandEdge = Math.min(
    sunElevationDeg - GOLDEN_HOUR_MIN_ELEVATION_DEG,
    GOLDEN_HOUR_MAX_ELEVATION_DEG - sunElevationDeg,
  );
  const confidence =
    distanceFromBandEdge >= HIGH_CONFIDENCE_MARGIN_DEG ? RecommendationConfidence.HIGH : RecommendationConfidence.MEDIUM;

  if (distanceFromNoseOrTail <= NOSE_TAIL_DEADZONE_DEG) {
    return new WindowRecommendation(
      WindowSide.EITHER,
      confidence,
      sunElevationDeg,
      "Golden-hour sun is roughly ahead of or behind the aircraft — both sides get the view.",
      observedAtUtc,
    );
  }

  // relativeBearing in (0, 180) => sun off the right side (clockwise from nose);
  // (180, 360) => sun off the left side. Standard aviation relative-bearing convention.
  const side = relativeBearing < 180 ? WindowSide.RIGHT : WindowSide.LEFT;
  const sideLabel = side === WindowSide.RIGHT ? "right" : "left";

  return new WindowRecommendation(
    side,
    confidence,
    sunElevationDeg,
    `Golden-hour sun is off the ${sideLabel} side of the aircraft.`,
    observedAtUtc,
  );
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
