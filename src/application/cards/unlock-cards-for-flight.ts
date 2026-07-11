import { Airport } from "../../domain/airport/airport";
import { AircraftCard } from "../../domain/cards/aircraft-card";
import { AirlineCard } from "../../domain/cards/airline-card";
import { AirportCard } from "../../domain/cards/airport-card";
import { FlightNotFoundByIdError } from "../errors";
import { Clock } from "../ports/clock";
import { CardRepository } from "../ports/card-repository";
import { FlightRepository } from "../ports/flight-repository";

export interface CardUnlockResult {
  newAirportCards: AirportCard[];
  newAircraftCards: AircraftCard[];
  newAirlineCards: AirlineCard[];
}

/**
 * Evaluates which new Collectible Cards a completed flight unlocks for a
 * user, running as part of flight-completion processing (i.e. after the
 * flight is saved to Flight Legacy). A card is unlocked the *first* time
 * its entity is encountered across all of the user's flights — repeating a
 * route/aircraft-model/airline never creates a duplicate or re-fires the
 * "new card" celebration. Origin and destination airports are evaluated
 * independently (a flight can unlock 0, 1, or 2 new airport cards).
 *
 * Race-safety is delegated entirely to CardRepository's DB-level unique
 * constraint (see infrastructure/persistence/prisma-card-repository.ts) —
 * this use case does not itself guard against concurrent duplicate
 * unlocks; it trusts tryUnlockXCard's return value as the single source of
 * truth for "was this newly unlocked."
 */
export class UnlockCardsForFlightUseCase {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly flightRepository: FlightRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, flightId: string): Promise<CardUnlockResult> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) throw new FlightNotFoundByIdError(flightId);

    const now = this.clock.now();

    const newAirportCards = (
      await Promise.all(
        [flight.route.origin, flight.route.destination].map((airport) => this.tryUnlockAirport(userId, airport, now)),
      )
    ).filter((card): card is AirportCard => card !== null);

    const newAircraftCards: AircraftCard[] = [];
    if (flight.aircraftAssignment) {
      const aircraftType = flight.aircraftAssignment.aircraft.type;
      const unlocked = await this.cardRepository.tryUnlockAircraftCard(userId, aircraftType.icaoTypeCode, now);
      if (unlocked) newAircraftCards.push(AircraftCard.from(aircraftType));
    }

    const newAirlineCards: AirlineCard[] = [];
    const airlineUnlocked = await this.cardRepository.tryUnlockAirlineCard(
      userId,
      flight.airline.iataCode.toString(),
      now,
    );
    if (airlineUnlocked) newAirlineCards.push(AirlineCard.from(flight.airline));

    return { newAirportCards, newAircraftCards, newAirlineCards };
  }

  private async tryUnlockAirport(userId: string, airport: Airport, now: Date): Promise<AirportCard | null> {
    const unlocked = await this.cardRepository.tryUnlockAirportCard(userId, airport.iataCode.toString(), now);
    return unlocked ? AirportCard.from(airport) : null;
  }
}
