import { PrismaClient } from "@prisma/client";
import { FlightLogRepository } from "../../application/ports/flight-log-repository";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { toDomainLoggedFlight } from "./mappers";

const include = { origin: true, destination: true, airline: true, aircraftType: true } as const;

export class PrismaFlightLogRepository implements FlightLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(flight: LoggedFlight): Promise<void> {
    await this.db.loggedFlight.upsert({
      where: { id: flight.id },
      create: {
        id: flight.id,
        userId: flight.userId,
        flightNumber: flight.flightNumber.toString(),
        flightDateUtc: flight.flightDate,
        airlineIataCode: flight.airline.iataCode.toString(),
        airlineSource: flight.provenance.airline,
        originIataCode: flight.route.origin.iataCode.toString(),
        originSource: flight.provenance.origin,
        destinationIataCode: flight.route.destination.iataCode.toString(),
        destinationSource: flight.provenance.destination,
        aircraftTypeCode: flight.aircraftType?.icaoTypeCode ?? null,
        aircraftTypeSource: flight.provenance.aircraftType,
        tailNumber: flight.tailNumber,
        note: flight.note,
        createdAt: flight.createdAt,
      },
      update: {
        flightNumber: flight.flightNumber.toString(),
        flightDateUtc: flight.flightDate,
        airlineIataCode: flight.airline.iataCode.toString(),
        airlineSource: flight.provenance.airline,
        originIataCode: flight.route.origin.iataCode.toString(),
        originSource: flight.provenance.origin,
        destinationIataCode: flight.route.destination.iataCode.toString(),
        destinationSource: flight.provenance.destination,
        aircraftTypeCode: flight.aircraftType?.icaoTypeCode ?? null,
        aircraftTypeSource: flight.provenance.aircraftType,
        tailNumber: flight.tailNumber,
        note: flight.note,
      },
    });
  }

  async findById(id: string): Promise<LoggedFlight | null> {
    const row = await this.db.loggedFlight.findUnique({ where: { id }, include });
    return row ? toDomainLoggedFlight(row) : null;
  }

  async listForUser(userId: string): Promise<LoggedFlight[]> {
    const rows = await this.db.loggedFlight.findMany({
      where: { userId },
      include,
      orderBy: { flightDateUtc: "desc" },
    });
    return rows.map(toDomainLoggedFlight);
  }
}
