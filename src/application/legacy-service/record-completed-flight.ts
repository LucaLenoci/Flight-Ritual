import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { FlightMemory, FlightMemorySnapshot } from "../../domain/legacy/flight-memory";
import { FlightNotEligibleForLegacyError, FlightNotFoundByIdError } from "../errors";
import { Clock } from "../ports/clock";
import { FlightRepository } from "../ports/flight-repository";
import { LegacyRepository } from "../ports/legacy-repository";

function buildSnapshot(flight: Flight): FlightMemorySnapshot {
  const departure = flight.actualDeparture ?? flight.scheduledDeparture;
  const arrival = flight.actualArrival ?? flight.scheduledArrival;
  const assignment = flight.aircraftAssignment;

  return {
    flightNumber: flight.flightNumber.toString(),
    airlineIataCode: flight.airline.iataCode.toString(),
    airlineName: flight.airline.name,
    originIataCode: flight.route.origin.iataCode.toString(),
    originCity: flight.route.origin.city,
    originCountry: flight.route.origin.country,
    destinationIataCode: flight.route.destination.iataCode.toString(),
    destinationCity: flight.route.destination.city,
    destinationCountry: flight.route.destination.country,
    departureDateUtc: departure.utcDate,
    distanceKm: flight.route.distanceKm(),
    durationMinutes: departure.minutesUntil(arrival),
    aircraftTypeIcaoCode: assignment?.aircraft.type.icaoTypeCode ?? null,
    aircraftTypeModel: assignment?.aircraft.type.model ?? null,
    aircraftRegistration: assignment?.aircraft.registration.toString() ?? null,
  };
}

/**
 * My Flight Legacy: saves a completed flight to a user's personal log.
 * Idempotent by design — saving the same flight twice returns the
 * already-saved memory rather than erroring, so a double-tap in the UI (or a
 * retried request) can't create duplicates or surface a confusing error.
 */
export class RecordCompletedFlightUseCase {
  constructor(
    private readonly flightRepository: FlightRepository,
    private readonly legacyRepository: LegacyRepository,
    private readonly clock: Clock,
    private readonly generateId: () => string,
  ) {}

  async execute(userId: string, flightId: string, note: string | null = null): Promise<FlightMemory> {
    const existing = await this.legacyRepository.findByUserAndFlight(userId, flightId);
    if (existing) return existing;

    const flight = await this.flightRepository.findById(flightId);
    if (!flight) throw new FlightNotFoundByIdError(flightId);

    if (flight.phase !== FlightPhase.ARRIVED) {
      throw new FlightNotEligibleForLegacyError(flightId);
    }

    const memory = new FlightMemory(
      this.generateId(),
      userId,
      flightId,
      this.clock.now(),
      note,
      buildSnapshot(flight),
    );

    await this.legacyRepository.save(memory);
    return memory;
  }
}
