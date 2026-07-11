import { Flight } from "../../../domain/flight/flight";
import { JourneyEvent } from "../../../domain/flight/journey-event";
import { FlightMemory } from "../../../domain/legacy/flight-memory";
import { UserCollection } from "../../../domain/legacy/user-collection";
import { RunwayMoment } from "../../../domain/runway-moment/runway-moment";
import { WindowRecommendation } from "../../../domain/golden-hour/window-recommendation";
import { AircraftCard } from "../../../domain/cards/aircraft-card";
import { AirlineCard } from "../../../domain/cards/airline-card";
import { AirportCard } from "../../../domain/cards/airport-card";
import { AlbumEntry, UserCardAlbum } from "../../../application/cards/get-user-card-album";
import { CardUnlockResult } from "../../../application/cards/unlock-cards-for-flight";

function serializeAirport(airport: Flight["route"]["origin"]) {
  return {
    iataCode: airport.iataCode.toString(),
    icaoCode: airport.icaoCode.toString(),
    name: airport.name,
    city: airport.city,
    country: airport.country,
    latitude: airport.coordinates.latitude,
    longitude: airport.coordinates.longitude,
    timeZone: airport.timeZone,
  };
}

export function serializeFlight(flight: Flight) {
  return {
    id: flight.id,
    flightNumber: flight.flightNumber.toString(),
    airline: {
      iataCode: flight.airline.iataCode.toString(),
      icaoDesignator: flight.airline.icaoDesignator.toString(),
      name: flight.airline.name,
    },
    origin: serializeAirport(flight.route.origin),
    destination: serializeAirport(flight.route.destination),
    distanceKm: Math.round(flight.route.distanceKm()),
    scheduledDepartureUtc: flight.scheduledDeparture.utcDate.toISOString(),
    scheduledArrivalUtc: flight.scheduledArrival.utcDate.toISOString(),
    actualDepartureUtc: flight.actualDeparture?.utcDate.toISOString() ?? null,
    actualArrivalUtc: flight.actualArrival?.utcDate.toISOString() ?? null,
    phase: flight.phase,
    delayMinutes: flight.delayMinutes,
    isDelayed: flight.isDelayed(),
    gate: flight.gate,
    aircraftAssignment: flight.aircraftAssignment
      ? {
          registration: flight.aircraftAssignment.aircraft.registration.toString(),
          type: {
            icaoTypeCode: flight.aircraftAssignment.aircraft.type.icaoTypeCode,
            manufacturer: flight.aircraftAssignment.aircraft.type.manufacturer,
            model: flight.aircraftAssignment.aircraft.type.model,
            facts: flight.aircraftAssignment.aircraft.type.facts,
          },
          ageYears: flight.aircraftAssignment.aircraft.ageYearsAsOf(new Date()),
          operatorIataCode: flight.aircraftAssignment.aircraft.operatorIataCode,
          source: flight.aircraftAssignment.source,
          confidence: flight.aircraftAssignment.confidence,
        }
      : null,
  };
}

export function serializeJourneyEvent(event: JourneyEvent) {
  return {
    type: event.type,
    occurredAtUtc: event.occurredAtUtc.toISOString(),
    detail: event.detail,
  };
}

export function serializeWindowRecommendation(recommendation: WindowRecommendation) {
  return {
    side: recommendation.side,
    confidence: recommendation.confidence,
    sunElevationDeg: Number.isFinite(recommendation.sunElevationDeg)
      ? Math.round(recommendation.sunElevationDeg * 10) / 10
      : null,
    reason: recommendation.reason,
    bestMomentUtc: recommendation.bestMomentUtc?.toISOString() ?? null,
  };
}

export function serializeRunwayMoment(moment: RunwayMoment) {
  return {
    phase: moment.phase,
    occurredAtUtc: moment.occurredAtUtc.toISOString(),
    headline: moment.headline,
    subtext: moment.subtext,
  };
}

export function serializeFlightMemory(memory: FlightMemory) {
  return {
    id: memory.id,
    savedAtUtc: memory.savedAtUtc.toISOString(),
    note: memory.note,
    snapshot: {
      ...memory.snapshot,
      departureDateUtc: memory.snapshot.departureDateUtc.toISOString(),
    },
  };
}

export function serializeUserCollection(collection: UserCollection) {
  return {
    airportIataCodes: Array.from(collection.airportIataCodes).sort(),
    airlineIataCodes: Array.from(collection.airlineIataCodes).sort(),
    aircraftTypeIcaoCodes: Array.from(collection.aircraftTypeIcaoCodes).sort(),
    routeKeys: Array.from(collection.routeKeys).sort(),
    countries: Array.from(collection.countries).sort(),
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
