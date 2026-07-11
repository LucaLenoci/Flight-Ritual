import { InvalidValueError } from "./errors";

// The designator group is lazy ({2,3}?), not greedy: since both the
// designator and number character classes accept digits, a greedy match
// would swallow a leading digit of the flight number into a 2-letter
// designator (e.g. "BA284" parsing as designator "BA2" + number "84")
// whenever a 3-char match is possible. Lazy matching finds the shortest
// valid designator first, which correctly recovers "BA" + "284" for 2-letter
// codes and still backtracks to a 3-char designator ("ITA" + "100") when a
// 2-char split isn't followed by a digit.
const FLIGHT_NUMBER_PATTERN = /^([A-Z0-9]{2,3}?)\s?(\d{1,4})([A-Z]?)$/;

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
