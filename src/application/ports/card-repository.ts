import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";

export interface CardRepository {
  /**
   * Returns true if the card was newly unlocked; false if the user already
   * owned it. Must be race-safe under concurrent calls for the same
   * (userId, entity). `sourceLoggedFlightId` records which flight triggered
   * the unlock, for Flight Log timeline badges and Card Detail back-links —
   * it is only ever set on first unlock, never overwritten on repeat calls.
   */
  tryUnlockAirportCard(
    userId: string,
    airportIataCode: string,
    nowUtc: Date,
    sourceLoggedFlightId: string | null,
  ): Promise<boolean>;
  tryUnlockAircraftCard(
    userId: string,
    aircraftTypeIcaoCode: string,
    nowUtc: Date,
    sourceLoggedFlightId: string | null,
  ): Promise<boolean>;
  tryUnlockAirlineCard(
    userId: string,
    airlineIataCode: string,
    nowUtc: Date,
    sourceLoggedFlightId: string | null,
  ): Promise<boolean>;

  listUserAirportCards(userId: string): Promise<UserAirportCard[]>;
  listUserAircraftCards(userId: string): Promise<UserAircraftCard[]>;
  listUserAirlineCards(userId: string): Promise<UserAirlineCard[]>;
}
