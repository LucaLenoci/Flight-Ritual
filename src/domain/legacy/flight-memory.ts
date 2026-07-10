/**
 * A denormalized snapshot of the facts that matter about a completed flight,
 * captured at save time. Deliberately decoupled from the live Flight/Airport
 * records: a memory must keep rendering correctly and contributing to stats
 * even if reference data changes or a provider later disagrees.
 */
export interface FlightMemorySnapshot {
  flightNumber: string;
  airlineIataCode: string;
  airlineName: string;
  originIataCode: string;
  originCity: string;
  originCountry: string;
  destinationIataCode: string;
  destinationCity: string;
  destinationCountry: string;
  departureDateUtc: Date;
  distanceKm: number;
  durationMinutes: number;
  aircraftTypeIcaoCode: string | null;
  aircraftTypeModel: string | null;
  aircraftRegistration: string | null;
}

export class FlightMemory {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly flightId: string,
    readonly savedAtUtc: Date,
    readonly note: string | null,
    readonly snapshot: FlightMemorySnapshot,
  ) {}

  routeKey(): string {
    return `${this.snapshot.originIataCode}-${this.snapshot.destinationIataCode}`;
  }
}
