import type {
  AircraftType as PrismaAircraftType,
  Airline as PrismaAirline,
  Airport as PrismaAirport,
  LoggedFlight as PrismaLoggedFlight,
  UserAircraftCard as PrismaUserAircraftCard,
  UserAirlineCard as PrismaUserAirlineCard,
  UserAirportCard as PrismaUserAirportCard,
} from "@prisma/client";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";
import { FieldProvenance, LoggedFlightProvenance } from "../../domain/flight-log/field-provenance";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { Route } from "../../domain/flight-log/route";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";

export function toDomainAirport(row: PrismaAirport): Airport {
  return new Airport(
    IataCode.create(row.iataCode),
    IcaoAirportCode.create(row.icaoCode),
    row.name,
    row.city,
    row.country,
    Coordinates.create(row.latitude, row.longitude),
    row.timeZone,
    row.continent,
  );
}

export function toDomainAirline(row: PrismaAirline): Airline {
  return new Airline(IataCode.create(row.iataCode), IcaoAirlineDesignator.create(row.icaoCode), row.name);
}

export function toDomainAircraftType(row: PrismaAircraftType): AircraftType {
  return new AircraftType(row.icaoTypeCode, row.manufacturer, row.model, JSON.parse(row.facts) as string[]);
}

export type PrismaLoggedFlightWithRelations = PrismaLoggedFlight & {
  origin: PrismaAirport;
  destination: PrismaAirport;
  airline: PrismaAirline;
  aircraftType: PrismaAircraftType | null;
};

function asProvenance(value: string): FieldProvenance {
  return value === FieldProvenance.ENRICHED ? FieldProvenance.ENRICHED : FieldProvenance.USER_PROVIDED;
}

export function toDomainLoggedFlight(row: PrismaLoggedFlightWithRelations): LoggedFlight {
  const provenance: LoggedFlightProvenance = {
    airline: asProvenance(row.airlineSource),
    origin: asProvenance(row.originSource),
    destination: asProvenance(row.destinationSource),
    aircraftType: asProvenance(row.aircraftTypeSource),
  };

  return new LoggedFlight(
    row.id,
    row.userId,
    FlightNumber.create(row.flightNumber),
    row.flightDateUtc,
    toDomainAirline(row.airline),
    new Route(toDomainAirport(row.origin), toDomainAirport(row.destination)),
    row.aircraftType ? toDomainAircraftType(row.aircraftType) : null,
    row.tailNumber,
    row.note,
    provenance,
    row.createdAt,
  );
}

export function toDomainUserAirportCard(row: PrismaUserAirportCard): UserAirportCard {
  return new UserAirportCard(row.id, row.userId, row.airportIataCode, row.firstCollectedAtUtc, row.sourceLoggedFlightId);
}

export function toDomainUserAircraftCard(row: PrismaUserAircraftCard): UserAircraftCard {
  return new UserAircraftCard(row.id, row.userId, row.aircraftTypeCode, row.firstCollectedAtUtc, row.sourceLoggedFlightId);
}

export function toDomainUserAirlineCard(row: PrismaUserAirlineCard): UserAirlineCard {
  return new UserAirlineCard(row.id, row.userId, row.airlineIataCode, row.firstCollectedAtUtc, row.sourceLoggedFlightId);
}
