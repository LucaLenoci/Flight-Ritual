import { Flight } from "../../../domain/flight/flight";
import { JourneyEvent } from "../../../domain/flight/journey-event";
import { FlightMemory } from "../../../domain/legacy/flight-memory";
import { UserCollection } from "../../../domain/legacy/user-collection";
import { RunwayMoment } from "../../../domain/runway-moment/runway-moment";
import { WindowRecommendation } from "../../../domain/golden-hour/window-recommendation";

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
