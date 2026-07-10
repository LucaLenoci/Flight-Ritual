export interface ProviderAircraftType {
  icaoTypeCode: string;
  manufacturer: string;
  model: string;
  facts: string[];
}

export interface ProviderAircraftDetails {
  registration: string;
  type: ProviderAircraftType;
  operatorIataCode: string | null;
  manufactureDate: Date | null;
}

/** Raised by adapters on transient failures so callers can fall back rather than fail the whole request. */
export class AircraftDataProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AircraftDataProviderError";
  }
}

/**
 * Port for resolving which physical aircraft operates a flight. Two distinct
 * lookups because they carry different confidence: a live provider can
 * confirm the exact tail number for *this* flight, while a historical-pattern
 * lookup only tells us what's typically flown on that flight number.
 */
export interface AircraftDataProvider {
  /** Live, tail-number-specific confirmation for this exact flight, if the provider has it. */
  fetchConfirmedAssignment(
    flightNumber: string,
    departureDateUtc: Date,
  ): Promise<ProviderAircraftDetails | null>;

  /** The aircraft most commonly flown on this flight number historically, used as a lower-confidence fallback. */
  fetchHistoricalPattern(flightNumber: string): Promise<ProviderAircraftDetails | null>;
}
