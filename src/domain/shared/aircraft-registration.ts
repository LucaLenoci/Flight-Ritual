import { InvalidValueError } from "./errors";

// Registrations vary by country (e.g. "G-XWBA", "N12345", "F-HZDX", "D-AIBL").
// We validate the general shape rather than every national scheme.
const REGISTRATION_PATTERN = /^[A-Z0-9]{1,2}-?[A-Z0-9]{2,6}$/;

/** An aircraft's civil registration ("tail number"), e.g. "G-XWBA". */
export class AircraftRegistration {
  private constructor(readonly value: string) {}

  static create(raw: string): AircraftRegistration {
    const normalized = raw.trim().toUpperCase();
    if (!REGISTRATION_PATTERN.test(normalized) || normalized.length < 4 || normalized.length > 8) {
      throw new InvalidValueError("AircraftRegistration", raw, "unrecognized registration format");
    }
    return new AircraftRegistration(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AircraftRegistration): boolean {
    return this.value === other.value;
  }
}
