import { Airport } from "../airport/airport";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** The origin/destination pair for a logged flight, with great-circle distance. */
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

  /** A stable key identifying this route irrespective of flight number/date, e.g. "LHR-JFK". */
  routeKey(): string {
    return `${this.origin.iataCode.toString()}-${this.destination.iataCode.toString()}`;
  }
}
