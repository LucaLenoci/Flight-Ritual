import { Airport } from "../airport/airport";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** The origin/destination pair for a flight, with great-circle geometry helpers. */
export class Route {
  constructor(
    readonly origin: Airport,
    readonly destination: Airport,
  ) {}

  /** Great-circle distance between origin and destination, in kilometers (haversine formula). */
  distanceKm(): number {
    const lat1 = toRadians(this.origin.coordinates.latitude);
    const lat2 = toRadians(this.destination.coordinates.latitude);
    const deltaLat = toRadians(
      this.destination.coordinates.latitude - this.origin.coordinates.latitude,
    );
    const deltaLon = toRadians(
      this.destination.coordinates.longitude - this.origin.coordinates.longitude,
    );

    const a =
      Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  /**
   * Interpolates a position along the great-circle path between origin and
   * destination using spherical linear interpolation (slerp), which follows
   * the actual flown arc rather than a straight lat/lon lerp.
   *
   * @param fraction 0 = origin, 1 = destination.
   */
  interpolatePosition(fraction: number): { latitude: number; longitude: number } {
    const clamped = Math.min(1, Math.max(0, fraction));
    const lat1 = toRadians(this.origin.coordinates.latitude);
    const lon1 = toRadians(this.origin.coordinates.longitude);
    const lat2 = toRadians(this.destination.coordinates.latitude);
    const lon2 = toRadians(this.destination.coordinates.longitude);

    const angularDistance =
      2 *
      Math.asin(
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
        ),
      );

    if (angularDistance === 0) {
      return { latitude: this.origin.coordinates.latitude, longitude: this.origin.coordinates.longitude };
    }

    const a = Math.sin((1 - clamped) * angularDistance) / Math.sin(angularDistance);
    const b = Math.sin(clamped * angularDistance) / Math.sin(angularDistance);

    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    const latitude = Math.atan2(z, Math.sqrt(x * x + y * y));
    const longitude = Math.atan2(y, x);

    return { latitude: toDegrees(latitude), longitude: toDegrees(longitude) };
  }

  /** Initial great-circle bearing (degrees, 0-360 clockwise from true north) from a point toward the destination. */
  bearingFrom(point: { latitude: number; longitude: number }): number {
    const lat1 = toRadians(point.latitude);
    const lat2 = toRadians(this.destination.coordinates.latitude);
    const deltaLon = toRadians(this.destination.coordinates.longitude - point.longitude);

    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }
}
