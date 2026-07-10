import { InvalidValueError } from "./errors";

/**
 * A point in time paired with the IANA time zone it should be *displayed* in.
 * Internally always stored as a UTC instant so comparisons and arithmetic are
 * unambiguous; the zone is carried along purely for local-time rendering,
 * preventing the common bug of formatting a UTC instant in server-local time.
 */
export class ZonedInstant {
  private constructor(
    readonly utcDate: Date,
    readonly timeZone: string,
  ) {}

  static fromUtc(utcDate: Date, timeZone: string): ZonedInstant {
    if (Number.isNaN(utcDate.getTime())) {
      throw new InvalidValueError("ZonedInstant.utcDate", utcDate, "not a valid date");
    }
    if (!isValidTimeZone(timeZone)) {
      throw new InvalidValueError("ZonedInstant.timeZone", timeZone, "not a recognized IANA time zone");
    }
    return new ZonedInstant(utcDate, timeZone);
  }

  isBefore(other: ZonedInstant): boolean {
    return this.utcDate.getTime() < other.utcDate.getTime();
  }

  isAfter(other: ZonedInstant): boolean {
    return this.utcDate.getTime() > other.utcDate.getTime();
  }

  minutesUntil(other: ZonedInstant): number {
    return (other.utcDate.getTime() - this.utcDate.getTime()) / 60_000;
  }

  /** Renders the instant in its own local time zone, e.g. "14:32". */
  formatLocalTime(): string {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: this.timeZone,
    }).format(this.utcDate);
  }
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}
