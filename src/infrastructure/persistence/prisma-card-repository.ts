import { Prisma, PrismaClient } from "@prisma/client";
import { CardRepository } from "../../application/ports/card-repository";
import { UserAircraftCard, UserAirlineCard, UserAirportCard } from "../../domain/cards/user-card-ownership";
import { toDomainUserAircraftCard, toDomainUserAirlineCard, toDomainUserAirportCard } from "./mappers";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

/**
 * Race-safe by construction: `create` either succeeds (this call is the
 * first to claim the (userId, entity) pair — newly unlocked) or fails with
 * a unique-constraint violation (someone already claimed it, possibly a
 * concurrent request that beat this one by microseconds) — never both, and
 * never a duplicate row either way. No read-then-write check-then-act
 * sequence exists here to race against.
 */
export class PrismaCardRepository implements CardRepository {
  constructor(private readonly db: PrismaClient) {}

  async tryUnlockAirportCard(userId: string, airportIataCode: string, nowUtc: Date): Promise<boolean> {
    return this.tryCreate(() =>
      this.db.userAirportCard.create({ data: { userId, airportIataCode, firstCollectedAtUtc: nowUtc } }),
    );
  }

  async tryUnlockAircraftCard(userId: string, aircraftTypeIcaoCode: string, nowUtc: Date): Promise<boolean> {
    return this.tryCreate(() =>
      this.db.userAircraftCard.create({
        data: { userId, aircraftTypeCode: aircraftTypeIcaoCode, firstCollectedAtUtc: nowUtc },
      }),
    );
  }

  async tryUnlockAirlineCard(userId: string, airlineIataCode: string, nowUtc: Date): Promise<boolean> {
    return this.tryCreate(() =>
      this.db.userAirlineCard.create({ data: { userId, airlineIataCode, firstCollectedAtUtc: nowUtc } }),
    );
  }

  async listUserAirportCards(userId: string): Promise<UserAirportCard[]> {
    const rows = await this.db.userAirportCard.findMany({ where: { userId } });
    return rows.map(toDomainUserAirportCard);
  }

  async listUserAircraftCards(userId: string): Promise<UserAircraftCard[]> {
    const rows = await this.db.userAircraftCard.findMany({ where: { userId } });
    return rows.map(toDomainUserAircraftCard);
  }

  async listUserAirlineCards(userId: string): Promise<UserAirlineCard[]> {
    const rows = await this.db.userAirlineCard.findMany({ where: { userId } });
    return rows.map(toDomainUserAirlineCard);
  }

  private async tryCreate(create: () => Promise<unknown>): Promise<boolean> {
    try {
      await create();
      return true;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION
  );
}
