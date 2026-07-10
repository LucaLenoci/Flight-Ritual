// Client-side DTO types mirroring the JSON shapes produced by
// src/app/api/_lib/serializers.ts. Kept separate from the domain layer so
// client components never import server-only code (Prisma, Node crypto, ...).

export type FlightPhaseDto =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "AIRBORNE"
  | "DESCENDING"
  | "LANDED"
  | "ARRIVED"
  | "CANCELLED"
  | "DIVERTED";

export type JourneyEventTypeDto =
  | "SCHEDULED"
  | "GATE_ASSIGNED"
  | "GATE_CHANGED"
  | "DELAY_UPDATED"
  | "BOARDING_STARTED"
  | "DEPARTED"
  | "TAKEOFF"
  | "CRUISE_REACHED"
  | "DESCENT_STARTED"
  | "LANDED"
  | "ARRIVED_AT_GATE"
  | "CANCELLED"
  | "DIVERTED";

export interface AirportDto {
  iataCode: string;
  icaoCode: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface AircraftAssignmentDto {
  registration: string;
  type: { icaoTypeCode: string; manufacturer: string; model: string; facts: string[] };
  ageYears: number | null;
  operatorIataCode: string | null;
  source: "PROVIDER_CONFIRMED" | "HISTORICAL_PATTERN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface FlightDto {
  id: string;
  flightNumber: string;
  airline: { iataCode: string; icaoDesignator: string; name: string };
  origin: AirportDto;
  destination: AirportDto;
  distanceKm: number;
  scheduledDepartureUtc: string;
  scheduledArrivalUtc: string;
  actualDepartureUtc: string | null;
  actualArrivalUtc: string | null;
  phase: FlightPhaseDto;
  delayMinutes: number;
  isDelayed: boolean;
  gate: string | null;
  aircraftAssignment: AircraftAssignmentDto | null;
}

export interface JourneyEventDto {
  type: JourneyEventTypeDto;
  occurredAtUtc: string;
  detail: Record<string, unknown>;
}

export type WindowSideDto = "LEFT" | "RIGHT" | "EITHER" | "NOT_APPLICABLE";

export interface WindowRecommendationDto {
  side: WindowSideDto;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  sunElevationDeg: number | null;
  reason: string;
  bestMomentUtc: string | null;
}

export interface RunwayMomentDto {
  phase: "TAKEOFF" | "LANDING";
  occurredAtUtc: string;
  headline: string;
  subtext: string;
}

export interface FlightDetailResponse {
  flight: FlightDto;
  events: JourneyEventDto[];
  goldenHour: WindowRecommendationDto;
  runwayMoment: RunwayMomentDto | null;
  degraded: boolean;
}

export interface TrackableFlightDto {
  flightNumber: string;
  scheduledDepartureUtc: string;
  originIataCode: string;
  destinationIataCode: string;
  airlineName: string;
}

export interface FlightMemorySnapshotDto {
  flightNumber: string;
  airlineIataCode: string;
  airlineName: string;
  originIataCode: string;
  originCity: string;
  originCountry: string;
  destinationIataCode: string;
  destinationCity: string;
  destinationCountry: string;
  departureDateUtc: string;
  distanceKm: number;
  durationMinutes: number;
  aircraftTypeIcaoCode: string | null;
  aircraftTypeModel: string | null;
  aircraftRegistration: string | null;
}

export interface FlightMemoryDto {
  id: string;
  savedAtUtc: string;
  note: string | null;
  snapshot: FlightMemorySnapshotDto;
}

export interface UserCollectionDto {
  airportIataCodes: string[];
  airlineIataCodes: string[];
  aircraftTypeIcaoCodes: string[];
  routeKeys: string[];
  countries: string[];
}

export interface StatsSnapshotDto {
  totalFlights: number;
  totalDistanceKm: number;
  totalFlightMinutes: number;
  uniqueAirportCount: number;
  uniqueAirlineCount: number;
  uniqueAircraftTypeCount: number;
  uniqueCountryCount: number;
  longestFlight: { flightNumber: string; distanceKm: number } | null;
  mostFrequentRoute: { routeKey: string; flightCount: number } | null;
}

export interface LegacyDashboardResponse {
  memories: FlightMemoryDto[];
  collection: UserCollectionDto;
  stats: StatsSnapshotDto;
}
