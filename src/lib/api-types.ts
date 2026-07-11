// Client-side DTO types mirroring the JSON shapes produced by
// src/app/api/_lib/serializers.ts. Kept separate from the domain layer so
// client components never import server-only code (Prisma, Node crypto, ...).

export type CardRarityDto = "COMMON" | "UNCOMMON" | "RARE" | "LEGENDARY";
export type FieldProvenanceDto = "ENRICHED" | "USER_PROVIDED";

export interface AirportDto {
  iataCode: string;
  icaoCode: string;
  name: string;
  city: string;
  country: string;
  continent: string | null;
  latitude: number;
  longitude: number;
}

export interface AirlineDto {
  iataCode: string;
  icaoDesignator: string;
  name: string;
}

export interface AircraftTypeDto {
  icaoTypeCode: string;
  manufacturer: string;
  model: string;
  facts: string[];
  cruiseSpeedKmh: number | null;
}

export interface LoggedFlightProvenanceDto {
  airline: FieldProvenanceDto;
  origin: FieldProvenanceDto;
  destination: FieldProvenanceDto;
  aircraftType: FieldProvenanceDto;
}

export interface FlightUnlockBadgeDto {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  label: string;
}

export interface LoggedFlightDto {
  id: string;
  flightNumber: string;
  flightDate: string;
  airline: AirlineDto;
  origin: AirportDto;
  destination: AirportDto;
  distanceKm: number;
  aircraftType: AircraftTypeDto | null;
  tailNumber: string | null;
  note: string | null;
  provenance: LoggedFlightProvenanceDto;
  createdAt: string;
  unlocks?: FlightUnlockBadgeDto[];
}

export interface FlightLogResponse {
  flights: LoggedFlightDto[];
}

export interface FlightRouteLookupResultDto {
  originIataCode: string;
  destinationIataCode: string;
  aircraftTypeIcaoCode: string | null;
}

export interface EnrichmentPreviewDto {
  flightNumber: string;
  airline: AirlineDto | null;
  route: FlightRouteLookupResultDto | null;
}

export interface RankedAirlineDto {
  iataCode: string;
  name: string;
  flightCount: number;
}

export interface RankedAircraftTypeDto {
  icaoTypeCode: string;
  model: string;
  flightCount: number;
}

export interface RankedAirportDto {
  iataCode: string;
  city: string;
  visitCount: number;
}

export interface LoggedFlightRefDto {
  flightNumber: string;
  flightDate: string;
}

export interface StatsSnapshotDto {
  totalFlights: number;
  totalDistanceKm: number;
  uniqueAirportCount: number;
  uniqueAirlineCount: number;
  uniqueAircraftTypeCount: number;
  uniqueCountryCount: number;
  uniqueContinentCount: number;
  mostFlownAirline: RankedAirlineDto | null;
  mostFlownAircraftType: RankedAircraftTypeDto | null;
  mostVisitedAirport: RankedAirportDto | null;
  longestFlight: { flightNumber: string; distanceKm: number } | null;
  firstLoggedFlight: LoggedFlightRefDto | null;
  latestLoggedFlight: LoggedFlightRefDto | null;
  mostFrequentRoute: RouteFrequencyDto | null;
  topRoutes: RouteFrequencyDto[];
}

export interface RouteFrequencyDto {
  routeKey: string;
  flightCount: number;
  percentage: number;
}

export interface AirportCardDto {
  iataCode: string;
  icaoCode: string;
  city: string;
  country: string;
  funFact: string;
  rarity: CardRarityDto;
}

export interface AircraftCardDto {
  icaoTypeCode: string;
  manufacturer: string;
  model: string;
  engineType: string;
  cruiseSpeedKmh: number | null;
  funFact: string;
  rarity: CardRarityDto;
}

export interface AirlineCardDto {
  iataCode: string;
  icaoDesignator: string;
  name: string;
  country: string;
  liveryColorHex: string;
  funFact: string;
  rarity: CardRarityDto;
}

export interface AlbumEntryDto<TCard> {
  card: TCard;
  owned: boolean;
  firstCollectedAtUtc: string | null;
  timesFlown: number;
  sourceLoggedFlightId: string | null;
}

export interface CardAlbumResponse {
  airports: AlbumEntryDto<AirportCardDto>[];
  aircraft: AlbumEntryDto<AircraftCardDto>[];
  airlines: AlbumEntryDto<AirlineCardDto>[];
}

export interface CardUnlockResultDto {
  newAirportCards: AirportCardDto[];
  newAircraftCards: AircraftCardDto[];
  newAirlineCards: AirlineCardDto[];
}

export interface CuriosityFactDto {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  title: string;
  body: string;
}

export interface NextMilestoneDto {
  name: string;
  countryThreshold: number;
  countriesRemaining: number;
}

export interface UserCuriositiesDto {
  countryCount: number;
  nextMilestone: NextMilestoneDto | null;
  facts: CuriosityFactDto[];
}

export interface BulkSaveRowInput {
  flightNumber: string;
  flightDate: string;
  originIataCode: string;
  destinationIataCode: string;
  airlineIataCode: string;
  aircraftTypeIcaoCode: string | null;
  tailNumber: string | null;
  note: string | null;
}

export interface BulkSaveRowResultDto {
  index: number;
  success: boolean;
  flight: LoggedFlightDto | null;
  cardUnlocks: CardUnlockResultDto | null;
  error: string | null;
}

export interface BulkSaveResponse {
  results: BulkSaveRowResultDto[];
}
