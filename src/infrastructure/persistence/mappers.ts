import type {
  Aircraft as PrismaAircraft,
  AircraftAssignment as PrismaAircraftAssignment,
  AircraftType as PrismaAircraftType,
  Airline as PrismaAirline,
  Airport as PrismaAirport,
  Flight as PrismaFlight,
  JourneyEvent as PrismaJourneyEvent,
  UserAircraftCard as PrismaUserAircraftCard,
  UserAirlineCard as PrismaUserAirlineCard,
  UserAirportCard as PrismaUserAirportCard,
} from "@prisma/client";
import { Aircraft } from "../../domain/aircraft/aircraft";
import { AircraftAssignment, AssignmentConfidence, AssignmentSource } from "../../domain/aircraft/aircraft-assignment";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";
import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { JourneyEvent, JourneyEventDetail, JourneyEventType } from "../../domain/flight/journey-event";
import { Route } from "../../domain/flight/route";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { AircraftRegistration } from "../../domain/shared/aircraft-registration";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";
import { ZonedInstant } from "../../domain/shared/zoned-instant";

export function toDomainAirport(row: PrismaAirport): Airport {
  return new Airport(
    IataCode.create(row.iataCode),
    IcaoAirportCode.create(row.icaoCode),
    row.name,
    row.city,
    row.country,
    Coordinates.create(row.latitude, row.longitude),
    row.timeZone,
  );
}

export function toDomainAirline(row: PrismaAirline): Airline {
  return new Airline(IataCode.create(row.iataCode), IcaoAirlineDesignator.create(row.icaoCode), row.name);
}

export function toDomainAircraftType(row: PrismaAircraftType): AircraftType {
  return new AircraftType(row.icaoTypeCode, row.manufacturer, row.model, JSON.parse(row.facts) as string[]);
}

export function toDomainAircraft(row: PrismaAircraft & { aircraftType: PrismaAircraftType }): Aircraft {
  return new Aircraft(
    AircraftRegistration.create(row.registration),
    toDomainAircraftType(row.aircraftType),
    row.operatorIataCode,
    row.manufactureDate,
  );
}

export function toDomainAircraftAssignment(
  row: PrismaAircraftAssignment & { aircraft: PrismaAircraft & { aircraftType: PrismaAircraftType } },
): AircraftAssignment {
  return new AircraftAssignment(
    toDomainAircraft(row.aircraft),
    row.source as AssignmentSource,
    row.confidence as AssignmentConfidence,
    row.assignedAtUtc,
  );
}

export type PrismaFlightWithRelations = PrismaFlight & {
  origin: PrismaAirport;
  destination: PrismaAirport;
  airline: PrismaAirline;
  aircraftAssignment:
    | (PrismaAircraftAssignment & { aircraft: PrismaAircraft & { aircraftType: PrismaAircraftType } })
    | null;
};

export function toDomainFlight(row: PrismaFlightWithRelations): Flight {
  const origin = toDomainAirport(row.origin);
  const destination = toDomainAirport(row.destination);
  return new Flight(
    row.id,
    FlightNumber.create(row.flightNumber),
    toDomainAirline(row.airline),
    new Route(origin, destination),
    ZonedInstant.fromUtc(row.scheduledDepartureUtc, origin.timeZone),
    ZonedInstant.fromUtc(row.scheduledArrivalUtc, destination.timeZone),
    row.phase as FlightPhase,
    row.delayMinutes,
    row.gate,
    row.actualDepartureUtc ? ZonedInstant.fromUtc(row.actualDepartureUtc, origin.timeZone) : null,
    row.actualArrivalUtc ? ZonedInstant.fromUtc(row.actualArrivalUtc, destination.timeZone) : null,
    row.aircraftAssignment ? toDomainAircraftAssignment(row.aircraftAssignment) : null,
  );
}

export function toDomainJourneyEvent(row: PrismaJourneyEvent): JourneyEvent {
  return JourneyEvent.create(
    row.flightId,
    row.type as JourneyEventType,
    row.occurredAtUtc,
    JSON.parse(row.payload) as JourneyEventDetail,
  );
}

export function toDomainUserAirportCard(row: PrismaUserAirportCard): UserAirportCard {
  return new UserAirportCard(row.id, row.userId, row.airportIataCode, row.firstCollectedAtUtc);
}

export function toDomainUserAircraftCard(row: PrismaUserAircraftCard): UserAircraftCard {
  return new UserAircraftCard(row.id, row.userId, row.aircraftTypeCode, row.firstCollectedAtUtc);
}

export function toDomainUserAirlineCard(row: PrismaUserAirlineCard): UserAirlineCard {
  return new UserAirlineCard(row.id, row.userId, row.airlineIataCode, row.firstCollectedAtUtc);
}
