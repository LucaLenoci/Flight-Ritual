import { InvalidValueError } from "./errors";

/** A geographic point in decimal degrees (WGS84). */
export class Coordinates {
  private constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

  static create(latitude: number, longitude: number): Coordinates {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new InvalidValueError("Coordinates.latitude", latitude, "must be between -90 and 90");
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new InvalidValueError("Coordinates.longitude", longitude, "must be between -180 and 180");
    }
    return new Coordinates(latitude, longitude);
  }
}
