import { InvalidValueError } from "./errors";

const FLIGHT_NUMBER_PATTERN = /^([A-Z0-9]{2,3})\s?(\d{1,4})([A-Z]?)$/;

/** An airline designator plus flight number, e.g. "BA284" or "AF 447". Normalizes formatting. */
export class FlightNumber {
  private constructor(
    readonly airlineDesignator: string,
    readonly number: string,
    readonly suffix: string,
  ) {}

  static create(raw: string): FlightNumber {
    const normalized = raw.trim().toUpperCase();
    const match = FLIGHT_NUMBER_PATTERN.exec(normalized);
    if (!match) {
      throw new InvalidValueError("FlightNumber", raw, "expected format like 'BA284' or 'AF447'");
    }
    const [, airlineDesignator, number, suffix] = match;
    return new FlightNumber(airlineDesignator!, number!, suffix ?? "");
  }

  toString(): string {
    return `${this.airlineDesignator}${this.number}${this.suffix}`;
  }

  equals(other: FlightNumber): boolean {
    return this.toString() === other.toString();
  }
}
