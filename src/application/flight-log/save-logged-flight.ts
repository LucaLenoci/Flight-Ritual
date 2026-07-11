import { FieldProvenance, LoggedFlightProvenance } from "../../domain/flight-log/field-provenance";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { Route } from "../../domain/flight-log/route";
import { FlightNumber } from "../../domain/shared/flight-number";
import { UnknownReferenceEntityError } from "../errors";
import { AircraftTypeReferenceProvider } from "../ports/aircraft-type-reference-provider";
import { AirlineReferenceProvider } from "../ports/airline-reference-provider";
import { AirportReferenceProvider } from "../ports/airport-reference-provider";
import { Clock } from "../ports/clock";
import { FlightLogRepository } from "../ports/flight-log-repository";
import { FlightRouteLookupProvider } from "../ports/flight-route-lookup-provider";

export interface SaveLoggedFlightInput {
  flightNumber: string;
  flightDate: Date;
  originIataCode: string;
  destinationIataCode: string;
  airlineIataCode: string;
  aircraftTypeIcaoCode: string | null;
  tailNumber: string | null;
  note: string | null;
}

/**
 * Saves a user's logged flight. Every reference field (airport/airline/
 * aircraft type) is validated against the seeded catalog server-side —
 * a client can never persist a flight against a code that doesn't exist,
 * regardless of what the enrichment preview suggested. Provenance per field
 * is derived here, independently of any client-supplied hint: it compares
 * the submitted value against what free enrichment would have produced
 * (flight-number-prefix airline resolution; route/aircraft-type lookup via
 * FlightRouteLookupProvider, a Phase-1 stub) rather than trusting a
 * client-sent "I auto-filled this" flag, which could be spoofed.
 */
export class SaveLoggedFlightUseCase {
  constructor(
    private readonly flightLogRepository: FlightLogRepository,
    private readonly airportReferenceProvider: AirportReferenceProvider,
    private readonly airlineReferenceProvider: AirlineReferenceProvider,
    private readonly aircraftTypeReferenceProvider: AircraftTypeReferenceProvider,
    private readonly flightRouteLookupProvider: FlightRouteLookupProvider,
    private readonly clock: Clock,
    private readonly generateId: () => string,
  ) {}

  async execute(userId: string, input: SaveLoggedFlightInput): Promise<LoggedFlight> {
    const flightNumber = FlightNumber.create(input.flightNumber);

    const [origin, destination, airline, aircraftType, routeLookup] = await Promise.all([
      this.airportReferenceProvider.findByIataCode(input.originIataCode),
      this.airportReferenceProvider.findByIataCode(input.destinationIataCode),
      this.airlineReferenceProvider.findByIataCode(input.airlineIataCode),
      input.aircraftTypeIcaoCode
        ? this.aircraftTypeReferenceProvider.findByIcaoTypeCode(input.aircraftTypeIcaoCode)
        : Promise.resolve(null),
      this.flightRouteLookupProvider.lookup(flightNumber.toString(), input.flightDate),
    ]);

    if (!origin) throw new UnknownReferenceEntityError("airport", input.originIataCode);
    if (!destination) throw new UnknownReferenceEntityError("airport", input.destinationIataCode);
    if (!airline) throw new UnknownReferenceEntityError("airline", input.airlineIataCode);
    if (input.aircraftTypeIcaoCode && !aircraftType) {
      throw new UnknownReferenceEntityError("aircraft type", input.aircraftTypeIcaoCode);
    }

    const enrichedAirline = await this.airlineReferenceProvider.findByIataCode(flightNumber.airlineDesignator);

    const provenance: LoggedFlightProvenance = {
      airline: enrichedAirline?.iataCode.equals(airline.iataCode)
        ? FieldProvenance.ENRICHED
        : FieldProvenance.USER_PROVIDED,
      origin: routeLookup?.originIataCode === origin.iataCode.toString() ? FieldProvenance.ENRICHED : FieldProvenance.USER_PROVIDED,
      destination:
        routeLookup?.destinationIataCode === destination.iataCode.toString()
          ? FieldProvenance.ENRICHED
          : FieldProvenance.USER_PROVIDED,
      aircraftType:
        aircraftType && routeLookup?.aircraftTypeIcaoCode === aircraftType.icaoTypeCode
          ? FieldProvenance.ENRICHED
          : FieldProvenance.USER_PROVIDED,
    };

    const flight = new LoggedFlight(
      this.generateId(),
      userId,
      flightNumber,
      input.flightDate,
      airline,
      new Route(origin, destination),
      aircraftType,
      input.tailNumber?.trim() || null,
      input.note?.trim() || null,
      provenance,
      this.clock.now(),
    );

    await this.flightLogRepository.save(flight);
    return flight;
  }
}
