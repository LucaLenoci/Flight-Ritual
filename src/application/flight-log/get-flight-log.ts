import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { CardRepository } from "../ports/card-repository";
import { FlightLogRepository } from "../ports/flight-log-repository";

export interface FlightUnlockBadge {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  label: string;
}

export interface LoggedFlightWithUnlocks {
  flight: LoggedFlight;
  unlocks: FlightUnlockBadge[];
}

/** Returns a user's logged flights, most recent first, each annotated with which cards it unlocked. */
export class GetFlightLogUseCase {
  constructor(
    private readonly flightLogRepository: FlightLogRepository,
    private readonly cardRepository: CardRepository,
  ) {}

  async execute(userId: string): Promise<LoggedFlightWithUnlocks[]> {
    const [flights, airportCards, aircraftCards, airlineCards] = await Promise.all([
      this.flightLogRepository.listForUser(userId),
      this.cardRepository.listUserAirportCards(userId),
      this.cardRepository.listUserAircraftCards(userId),
      this.cardRepository.listUserAirlineCards(userId),
    ]);

    const unlocksByFlightId = new Map<string, FlightUnlockBadge[]>();
    const addUnlock = (flightId: string | null, badge: FlightUnlockBadge) => {
      if (!flightId) return;
      const list = unlocksByFlightId.get(flightId) ?? [];
      list.push(badge);
      unlocksByFlightId.set(flightId, list);
    };
    for (const card of airportCards) addUnlock(card.sourceLoggedFlightId, { kind: "AIRPORT", label: card.airportIataCode });
    for (const card of aircraftCards) {
      addUnlock(card.sourceLoggedFlightId, { kind: "AIRCRAFT", label: card.aircraftTypeIcaoCode });
    }
    for (const card of airlineCards) addUnlock(card.sourceLoggedFlightId, { kind: "AIRLINE", label: card.airlineIataCode });

    return [...flights]
      .sort((a, b) => b.flightDate.getTime() - a.flightDate.getTime())
      .map((flight) => ({ flight, unlocks: unlocksByFlightId.get(flight.id) ?? [] }));
  }
}
