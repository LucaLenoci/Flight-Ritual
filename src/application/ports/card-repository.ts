import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";

export interface CardRepository {
  /** Returns true if the card was newly unlocked; false if the user already owned it. Must be race-safe under concurrent calls for the same (userId, entity). */
  tryUnlockAirportCard(userId: string, airportIataCode: string, nowUtc: Date): Promise<boolean>;
  tryUnlockAircraftCard(userId: string, aircraftTypeIcaoCode: string, nowUtc: Date): Promise<boolean>;
  tryUnlockAirlineCard(userId: string, airlineIataCode: string, nowUtc: Date): Promise<boolean>;

  listUserAirportCards(userId: string): Promise<UserAirportCard[]>;
  listUserAircraftCards(userId: string): Promise<UserAircraftCard[]>;
  listUserAirlineCards(userId: string): Promise<UserAirlineCard[]>;
}
