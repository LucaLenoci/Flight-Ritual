import SunCalc from "suncalc";

/**
 * Thin adapter around the `suncalc` astronomical library, converting its
 * south-based azimuth convention into standard compass bearing (0-360,
 * clockwise from true north) so the rest of the app works in one consistent
 * frame of reference. Kept out of the domain layer so domain stays free of
 * third-party dependencies; this is the only place that talks to suncalc.
 */
export interface SolarPosition {
  /** Compass bearing (0-360, clockwise from true north) of the sun. */
  azimuthDeg: number;
  /** Elevation above the horizon in degrees; negative when below the horizon. */
  elevationDeg: number;
}

export function calculateSolarPosition(atUtc: Date, latitude: number, longitude: number): SolarPosition {
  const position = SunCalc.getPosition(atUtc, latitude, longitude);
  const azimuthDeg = (radiansToDegrees(position.azimuth) + 180 + 360) % 360;
  const elevationDeg = radiansToDegrees(position.altitude);
  return { azimuthDeg, elevationDeg };
}

function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
