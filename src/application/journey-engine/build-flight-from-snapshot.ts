import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { Route } from "../../domain/flight/route";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { Coordinates } from "../../domain/shared/coordinates";
import { FlightNumber } from "../../domain/shared/flight-number";
import { ZonedInstant } from "../../domain/shared/zoned-instant";
import { ProviderAirportRef, ProviderFlightSnapshot } from "../ports/flight-data-provider";
import { mapProviderStatusToPhase } from "./map-provider-status";

function toAirport(ref: ProviderAirportRef): Airport {
  return new Airport(
    IataCode.create(ref.iataCode),
    IcaoAirportCode.create(ref.icaoCode),
    ref.name,
    ref.city,
    ref.country,
    Coordinates.create(ref.latitude, ref.longitude),
    ref.timeZone,
  );
}

/**
 * Builds a fresh domain Flight aggregate from a provider snapshot. Used both
 * when we start tracking a flight for the first time (existingFlightId is
 * undefined, so a new id is minted) and when refreshing an already-tracked
 * flight (existingFlightId/aircraftAssignment are carried over, since the
 * provider snapshot doesn't know about aircraft enrichment we've already done).
 */
export function buildFlightFromSnapshot(
  snapshot: ProviderFlightSnapshot,
  options: {
    existingFlightId?: string;
    phaseOverride?: FlightPhase;
    aircraftAssignment?: Flight["aircraftAssignment"];
    newFlightId: () => string;
  },
): Flight {
  const origin = toAirport(snapshot.origin);
  const destination = toAirport(snapshot.destination);

  return new Flight(
    options.existingFlightId ?? options.newFlightId(),
    FlightNumber.create(snapshot.flightNumber),
    new Airline(
      IataCode.create(snapshot.airline.iataCode),
      IcaoAirlineDesignator.create(snapshot.airline.icaoDesignator),
      snapshot.airline.name,
    ),
    new Route(origin, destination),
    ZonedInstant.fromUtc(snapshot.scheduledDepartureUtc, origin.timeZone),
    ZonedInstant.fromUtc(snapshot.scheduledArrivalUtc, destination.timeZone),
    options.phaseOverride ?? mapProviderStatusToPhase(snapshot.status),
    snapshot.delayMinutes,
    snapshot.gate,
    snapshot.actualDepartureUtc ? ZonedInstant.fromUtc(snapshot.actualDepartureUtc, origin.timeZone) : null,
    snapshot.actualArrivalUtc ? ZonedInstant.fromUtc(snapshot.actualArrivalUtc, destination.timeZone) : null,
    options.aircraftAssignment ?? null,
  );
}
