import { InvalidValueError } from "./errors";

/**
 * IATA code, 2-3 characters. Used for both airports (e.g. "JFK" — always
 * letters in practice) and airlines (e.g. "BA", but also legitimately
 * alphanumeric like "9W" or "5J") — the character class allows digits so it
 * doesn't reject real airline codes; airport-specific letters-only
 * filtering happens where airport data is sourced (see
 * infrastructure/seed/seed-reference-data.ts), not in this shared value
 * object.
 */
export class IataCode {
  private constructor(readonly value: string) {}

  static create(raw: string): IataCode {
    const normalized = raw.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,3}$/.test(normalized)) {
      throw new InvalidValueError("IataCode", raw, "expected 2-3 alphanumeric characters");
    }
    return new IataCode(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: IataCode): boolean {
    return this.value === other.value;
  }
}

/** ICAO airport code: exactly 4 uppercase letters (e.g. "KJFK", "EGLL"). */
export class IcaoAirportCode {
  private constructor(readonly value: string) {}

  static create(raw: string): IcaoAirportCode {
    const normalized = raw.trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(normalized)) {
      throw new InvalidValueError("IcaoAirportCode", raw, "expected 4 uppercase letters");
    }
    return new IcaoAirportCode(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: IcaoAirportCode): boolean {
    return this.value === other.value;
  }
}

/** ICAO airline designator: exactly 3 uppercase letters (e.g. "BAW"). */
export class IcaoAirlineDesignator {
  private constructor(readonly value: string) {}

  static create(raw: string): IcaoAirlineDesignator {
    const normalized = raw.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new InvalidValueError("IcaoAirlineDesignator", raw, "expected 3 uppercase letters");
    }
    return new IcaoAirlineDesignator(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: IcaoAirlineDesignator): boolean {
    return this.value === other.value;
  }
}
