/**
 * Port for an external live-flight-data source. This DTO shape is the
 * anti-corruption boundary: a real adapter (AeroDataBox, OpenSky, FlightAware,
 * ...) translates that provider's own vocabulary and schema into this shape,
 * so nothing above this port ever depends on a specific vendor's API.
 */
export interface ProviderAirportRef {
  iataCode: string;
  icaoCode: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface ProviderAirlineRef {
  iataCode: string;
  icaoDesignator: string;
  name: string;
}

/** Provider's own status vocabulary for this snapshot; mapped to our FlightPhase by the journey engine. */
export enum ProviderFlightStatus {
  SCHEDULED = "SCHEDULED",
  BOARDING = "BOARDING",
  DEPARTED = "DEPARTED",
  AIRBORNE = "AIRBORNE",
  DESCENDING = "DESCENDING",
  LANDED = "LANDED",
  ARRIVED = "ARRIVED",
  CANCELLED = "CANCELLED",
  DIVERTED = "DIVERTED",
}

export interface ProviderFlightSnapshot {
  flightNumber: string;
  airline: ProviderAirlineRef;
  origin: ProviderAirportRef;
  destination: ProviderAirportRef;
  scheduledDepartureUtc: Date;
  scheduledArrivalUtc: Date;
  actualDepartureUtc: Date | null;
  actualArrivalUtc: Date | null;
  gate: string | null;
  delayMinutes: number;
  status: ProviderFlightStatus;
  observedAtUtc: Date;
}

/** Raised by adapters on transient failures (timeout, non-2xx, malformed payload) so callers can degrade gracefully. */
export class FlightDataProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FlightDataProviderError";
  }
}

export interface FlightDataProvider {
  /** Resolves to null (not thrown) when the flight genuinely doesn't exist for that date — a valid, expected outcome. */
  fetchSnapshot(flightNumber: string, departureDateUtc: Date): Promise<ProviderFlightSnapshot | null>;
}
