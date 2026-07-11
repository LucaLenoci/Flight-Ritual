import { AircraftCard } from "../../../domain/cards/aircraft-card";
import { AirlineCard } from "../../../domain/cards/airline-card";
import { AirportCard } from "../../../domain/cards/airport-card";
import { Airport } from "../../../domain/airport/airport";
import { Airline } from "../../../domain/airport/airline";
import { AircraftType } from "../../../domain/aircraft/aircraft-type";
import { LoggedFlight } from "../../../domain/flight-log/logged-flight";
import { StatsSnapshot } from "../../../domain/statistics/stats-snapshot";
import { AlbumEntry, UserCardAlbum } from "../../../application/cards/get-user-card-album";
import { CardUnlockResult } from "../../../application/cards/unlock-cards-for-flight";
import { EnrichmentPreview } from "../../../application/flight-enrichment/enrich-flight";

export function serializeAirport(airport: Airport) {
  return {
    iataCode: airport.iataCode.toString(),
    icaoCode: airport.icaoCode.toString(),
    name: airport.name,
    city: airport.city,
    country: airport.country,
    continent: airport.continent,
    latitude: airport.coordinates.latitude,
    longitude: airport.coordinates.longitude,
  };
}

export function serializeAirline(airline: Airline) {
  return {
    iataCode: airline.iataCode.toString(),
    icaoDesignator: airline.icaoDesignator.toString(),
    name: airline.name,
  };
}

export function serializeAircraftType(type: AircraftType) {
  return {
    icaoTypeCode: type.icaoTypeCode,
    manufacturer: type.manufacturer,
    model: type.model,
    facts: type.facts,
  };
}

export function serializeLoggedFlight(flight: LoggedFlight) {
  return {
    id: flight.id,
    flightNumber: flight.flightNumber.toString(),
    flightDate: flight.flightDate.toISOString(),
    airline: serializeAirline(flight.airline),
    origin: serializeAirport(flight.route.origin),
    destination: serializeAirport(flight.route.destination),
    distanceKm: Math.round(flight.distanceKm()),
    aircraftType: flight.aircraftType ? serializeAircraftType(flight.aircraftType) : null,
    tailNumber: flight.tailNumber,
    note: flight.note,
    provenance: flight.provenance,
    createdAt: flight.createdAt.toISOString(),
  };
}

export function serializeEnrichmentPreview(preview: EnrichmentPreview) {
  return {
    flightNumber: preview.flightNumber,
    airline: preview.airline ? serializeAirline(preview.airline) : null,
    route: preview.route,
  };
}

export function serializeStatsSnapshot(stats: StatsSnapshot) {
  return {
    ...stats,
    firstLoggedFlight: stats.firstLoggedFlight
      ? { ...stats.firstLoggedFlight, flightDate: stats.firstLoggedFlight.flightDate.toISOString() }
      : null,
    latestLoggedFlight: stats.latestLoggedFlight
      ? { ...stats.latestLoggedFlight, flightDate: stats.latestLoggedFlight.flightDate.toISOString() }
      : null,
  };
}

export function serializeAirportCard(card: AirportCard) {
  return {
    iataCode: card.airport.iataCode.toString(),
    icaoCode: card.airport.icaoCode.toString(),
    city: card.airport.city,
    country: card.airport.country,
    rarity: card.rarity,
  };
}

export function serializeAircraftCard(card: AircraftCard) {
  return {
    icaoTypeCode: card.aircraftType.icaoTypeCode,
    manufacturer: card.aircraftType.manufacturer,
    model: card.aircraftType.model,
    engineType: card.engineType,
    funFact: card.funFact(),
    rarity: card.rarity,
  };
}

export function serializeAirlineCard(card: AirlineCard) {
  return {
    iataCode: card.airline.iataCode.toString(),
    icaoDesignator: card.airline.icaoDesignator.toString(),
    name: card.airline.name,
    country: card.country,
    liveryColorHex: card.liveryColorHex,
    funFact: card.funFact,
    rarity: card.rarity,
  };
}

export function serializeAlbumEntry<TDomainCard, TDto>(
  entry: AlbumEntry<TDomainCard>,
  serializeCard: (card: TDomainCard) => TDto,
) {
  return {
    card: serializeCard(entry.card),
    owned: entry.owned,
    firstCollectedAtUtc: entry.firstCollectedAtUtc?.toISOString() ?? null,
  };
}

export function serializeCardAlbum(album: UserCardAlbum) {
  return {
    airports: album.airports.map((entry) => serializeAlbumEntry(entry, serializeAirportCard)),
    aircraft: album.aircraft.map((entry) => serializeAlbumEntry(entry, serializeAircraftCard)),
    airlines: album.airlines.map((entry) => serializeAlbumEntry(entry, serializeAirlineCard)),
  };
}

export function serializeCardUnlockResult(result: CardUnlockResult) {
  return {
    newAirportCards: result.newAirportCards.map(serializeAirportCard),
    newAircraftCards: result.newAircraftCards.map(serializeAircraftCard),
    newAirlineCards: result.newAirlineCards.map(serializeAirlineCard),
  };
}
