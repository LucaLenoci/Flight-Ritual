import { Prisma, PrismaClient } from "@prisma/client";
import { Flight } from "../../domain/flight/flight";
import { JourneyEvent } from "../../domain/flight/journey-event";
import { FlightRepository } from "../../application/ports/flight-repository";
import { toDomainFlight, toDomainJourneyEvent } from "./mappers";

const FLIGHT_INCLUDE = {
  origin: true,
  destination: true,
  airline: true,
  aircraftAssignment: { include: { aircraft: { include: { aircraftType: true } } } },
} satisfies Prisma.FlightInclude;

// SQLite (and Postgres) unique-constraint violation code.
const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

export class PrismaFlightRepository implements FlightRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByFlightNumberAndDeparture(flightNumber: string, scheduledDepartureUtc: Date): Promise<Flight | null> {
    const row = await this.db.flight.findUnique({
      where: { flightNumber_scheduledDepartureUtc: { flightNumber, scheduledDepartureUtc } },
      include: FLIGHT_INCLUDE,
    });
    return row ? toDomainFlight(row) : null;
  }

  async findById(flightId: string): Promise<Flight | null> {
    const row = await this.db.flight.findUnique({ where: { id: flightId }, include: FLIGHT_INCLUDE });
    return row ? toDomainFlight(row) : null;
  }

  async save(flight: Flight): Promise<void> {
    await this.upsertAirport(flight.route.origin);
    await this.upsertAirport(flight.route.destination);
    await this.upsertAirline(flight.airline);

    if (flight.aircraftAssignment) {
      await this.upsertAircraftAssignment(flight.id, flight.aircraftAssignment);
    }

    await this.db.flight.upsert({
      where: { id: flight.id },
      create: {
        id: flight.id,
        flightNumber: flight.flightNumber.toString(),
        airlineIataCode: flight.airline.iataCode.toString(),
        originIataCode: flight.route.origin.iataCode.toString(),
        destinationIataCode: flight.route.destination.iataCode.toString(),
        scheduledDepartureUtc: flight.scheduledDeparture.utcDate,
        scheduledArrivalUtc: flight.scheduledArrival.utcDate,
        actualDepartureUtc: flight.actualDeparture?.utcDate ?? null,
        actualArrivalUtc: flight.actualArrival?.utcDate ?? null,
        gate: flight.gate,
        delayMinutes: flight.delayMinutes,
        phase: flight.phase,
      },
      update: {
        actualDepartureUtc: flight.actualDeparture?.utcDate ?? null,
        actualArrivalUtc: flight.actualArrival?.utcDate ?? null,
        gate: flight.gate,
        delayMinutes: flight.delayMinutes,
        phase: flight.phase,
      },
    });
  }

  async appendJourneyEventIfNew(event: JourneyEvent): Promise<boolean> {
    try {
      await this.db.journeyEvent.create({
        data: {
          flightId: event.flightId,
          type: event.type,
          sequenceKey: event.sequenceKey,
          occurredAtUtc: event.occurredAtUtc,
          payload: JSON.stringify(event.detail),
        },
      });
      return true;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  async listJourneyEvents(flightId: string): Promise<JourneyEvent[]> {
    const rows = await this.db.journeyEvent.findMany({
      where: { flightId },
      orderBy: { occurredAtUtc: "asc" },
    });
    return rows.map(toDomainJourneyEvent);
  }

  private async upsertAirport(airport: Flight["route"]["origin"]): Promise<void> {
    await this.db.airport.upsert({
      where: { iataCode: airport.iataCode.toString() },
      create: {
        iataCode: airport.iataCode.toString(),
        icaoCode: airport.icaoCode.toString(),
        name: airport.name,
        city: airport.city,
        country: airport.country,
        latitude: airport.coordinates.latitude,
        longitude: airport.coordinates.longitude,
        timeZone: airport.timeZone,
      },
      update: {},
    });
  }

  private async upsertAirline(airline: Flight["airline"]): Promise<void> {
    await this.db.airline.upsert({
      where: { iataCode: airline.iataCode.toString() },
      create: {
        iataCode: airline.iataCode.toString(),
        icaoCode: airline.icaoDesignator.toString(),
        name: airline.name,
      },
      update: {},
    });
  }

  private async upsertAircraftAssignment(
    flightId: string,
    assignment: NonNullable<Flight["aircraftAssignment"]>,
  ): Promise<void> {
    await this.db.aircraftType.upsert({
      where: { icaoTypeCode: assignment.aircraft.type.icaoTypeCode },
      create: {
        icaoTypeCode: assignment.aircraft.type.icaoTypeCode,
        manufacturer: assignment.aircraft.type.manufacturer,
        model: assignment.aircraft.type.model,
        facts: JSON.stringify(assignment.aircraft.type.facts),
      },
      update: {},
    });

    await this.db.aircraft.upsert({
      where: { registration: assignment.aircraft.registration.toString() },
      create: {
        registration: assignment.aircraft.registration.toString(),
        aircraftTypeCode: assignment.aircraft.type.icaoTypeCode,
        operatorIataCode: assignment.aircraft.operatorIataCode,
        manufactureDate: assignment.aircraft.manufactureDate,
      },
      update: {},
    });

    await this.db.aircraftAssignment.upsert({
      where: { flightId },
      create: {
        flightId,
        aircraftRegistration: assignment.aircraft.registration.toString(),
        source: assignment.source,
        confidence: assignment.confidence,
        assignedAtUtc: assignment.assignedAtUtc,
      },
      update: {
        aircraftRegistration: assignment.aircraft.registration.toString(),
        source: assignment.source,
        confidence: assignment.confidence,
        assignedAtUtc: assignment.assignedAtUtc,
      },
    });
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION
  );
}
