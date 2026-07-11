/**
 * Ownership records — one row per user per entity, first-collected date
 * attached. These are the persisted source of truth for "does this user
 * already have this card"; identity is (userId, entityKey), enforced by a
 * database unique constraint (see infrastructure/persistence), not just an
 * application-level check, so concurrent unlock attempts can never race
 * into duplicates. `sourceLoggedFlightId` records which flight triggered
 * the unlock (null for cards unlocked before this field existed, or by a
 * future bulk-import path with no single triggering flight).
 */

export class UserAirportCard {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly airportIataCode: string,
    readonly firstCollectedAtUtc: Date,
    readonly sourceLoggedFlightId: string | null = null,
  ) {}
}

export class UserAircraftCard {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly aircraftTypeIcaoCode: string,
    readonly firstCollectedAtUtc: Date,
    readonly sourceLoggedFlightId: string | null = null,
  ) {}
}

export class UserAirlineCard {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly airlineIataCode: string,
    readonly firstCollectedAtUtc: Date,
    readonly sourceLoggedFlightId: string | null = null,
  ) {}
}
