import { CardCatalogProvider } from "../../application/ports/card-catalog-provider";
import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { Airline } from "../../domain/airport/airline";
import { Airport } from "../../domain/airport/airport";
import { IataCode, IcaoAirlineDesignator, IcaoAirportCode } from "../../domain/shared/airport-code";
import { Coordinates } from "../../domain/shared/coordinates";
import { ProviderAircraftType } from "../../application/ports/aircraft-data-provider";
import { ProviderAirlineRef, ProviderAirportRef } from "../../application/ports/flight-data-provider";
import { FLIGHT_FIXTURES } from "./fixtures/flight-fixtures";

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

function toAirline(ref: ProviderAirlineRef): Airline {
  return new Airline(IataCode.create(ref.iataCode), IcaoAirlineDesignator.create(ref.icaoDesignator), ref.name);
}

function toAircraftType(ref: ProviderAircraftType): AircraftType {
  return new AircraftType(ref.icaoTypeCode, ref.manufacturer, ref.model, ref.facts);
}

/**
 * Derives the full collectible-card catalog from the same fixture flights
 * the mock flight/aircraft data providers use — the entire real-world
 * universe this demo knows about. A production catalog would be backed by
 * a real, much larger reference dataset instead.
 */
export class MockCardCatalogProvider implements CardCatalogProvider {
  listAirportCards(): AirportCard[] {
    const byCode = new Map<string, Airport>();
    for (const fixture of FLIGHT_FIXTURES) {
      byCode.set(fixture.origin.iataCode, toAirport(fixture.origin));
      byCode.set(fixture.destination.iataCode, toAirport(fixture.destination));
    }
    return Array.from(byCode.values())
      .sort((a, b) => a.iataCode.toString().localeCompare(b.iataCode.toString()))
      .map(AirportCard.from);
  }

  listAircraftCards(): AircraftCard[] {
    const byCode = new Map<string, AircraftType>();
    for (const fixture of FLIGHT_FIXTURES) {
      byCode.set(fixture.aircraft.type.icaoTypeCode, toAircraftType(fixture.aircraft.type));
    }
    return Array.from(byCode.values())
      .sort((a, b) => a.icaoTypeCode.localeCompare(b.icaoTypeCode))
      .map(AircraftCard.from);
  }

  listAirlineCards(): AirlineCard[] {
    const byCode = new Map<string, Airline>();
    for (const fixture of FLIGHT_FIXTURES) {
      byCode.set(fixture.airline.iataCode, toAirline(fixture.airline));
    }
    return Array.from(byCode.values())
      .sort((a, b) => a.iataCode.toString().localeCompare(b.iataCode.toString()))
      .map(AirlineCard.from);
  }
}
