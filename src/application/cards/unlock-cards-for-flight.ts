import { Airport } from "../../domain/airport/airport";
import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";
import { FlightNotFoundByIdError } from "../errors";
import { Clock } from "../ports/clock";
import { CardRepository } from "../ports/card-repository";
import { FlightLogRepository } from "../ports/flight-log-repository";

export interface CardUnlockResult {
  newAirportCards: AirportCard[];
  newAircraftCards: AircraftCard[];
  newAirlineCards: AirlineCard[];
}

/**
 * Evaluates which new Collectible Cards a logged flight unlocks for a user,
 * running as part of saving a flight to the Flight Log. A card is unlocked
 * the *first* time its entity is encountered across all of the user's
 * logged flights — repeating a route/aircraft-model/airline never creates a
 * duplicate or re-fires the "new card" celebration. Origin and destination
 * airports are evaluated independently (a flight can unlock 0, 1, or 2 new
 * airport cards). Aircraft cards unlock by model/type, never by tail number
 * — a LoggedFlight without an aircraft type simply unlocks no aircraft card.
 *
 * Race-safety is delegated entirely to CardRepository's DB-level unique
 * constraint (see infrastructure/persistence/prisma-card-repository.ts) —
 * this use case does not itself guard against concurrent duplicate
 * unlocks; it trusts tryUnlockXCard's return value as the single source of
 * truth for "was this newly unlocked." Re-processing the same flight is
 * therefore safe and idempotent: it simply yields zero new cards the second
 * time.
 */
export class UnlockCardsForFlightUseCase {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly flightLogRepository: FlightLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, flightId: string): Promise<CardUnlockResult> {
    const flight = await this.flightLogRepository.findById(flightId);
    if (!flight) throw new FlightNotFoundByIdError(flightId);

    const now = this.clock.now();

    const newAirportCards = (
      await Promise.all(
        [flight.route.origin, flight.route.destination].map((airport) =>
          this.tryUnlockAirport(userId, airport, now, flightId),
        ),
      )
    ).filter((card): card is AirportCard => card !== null);

    const newAircraftCards: AircraftCard[] = [];
    if (flight.aircraftType) {
      const unlocked = await this.cardRepository.tryUnlockAircraftCard(
        userId,
        flight.aircraftType.icaoTypeCode,
        now,
        flightId,
      );
      if (unlocked) newAircraftCards.push(AircraftCard.from(flight.aircraftType));
    }

    const newAirlineCards: AirlineCard[] = [];
    const airlineUnlocked = await this.cardRepository.tryUnlockAirlineCard(
      userId,
      flight.airline.iataCode.toString(),
      now,
      flightId,
    );
    if (airlineUnlocked) newAirlineCards.push(AirlineCard.from(flight.airline));

    return { newAirportCards, newAircraftCards, newAirlineCards };
  }

  private async tryUnlockAirport(
    userId: string,
    airport: Airport,
    now: Date,
    flightId: string,
  ): Promise<AirportCard | null> {
    const unlocked = await this.cardRepository.tryUnlockAirportCard(
      userId,
      airport.iataCode.toString(),
      now,
      flightId,
    );
    return unlocked ? AirportCard.from(airport) : null;
  }
}
