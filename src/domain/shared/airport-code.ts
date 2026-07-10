import { InvalidValueError } from "./errors";

/** IATA code: exactly 3 uppercase letters. Used for both airports (e.g. "JFK") and airlines (e.g. "BA"). */
export class IataCode {
  private constructor(readonly value: string) {}

  static create(raw: string): IataCode {
    const normalized = raw.trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(normalized)) {
      throw new InvalidValueError("IataCode", raw, "expected 2-3 uppercase letters");
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
