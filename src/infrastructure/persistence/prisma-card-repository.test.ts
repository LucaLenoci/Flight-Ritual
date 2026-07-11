import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma-client";
import { PrismaCardRepository } from "./prisma-card-repository";

/**
 * Integration test against the real SQLite database (not an in-memory
 * fake) — the whole point is to verify the @@unique([userId, airportIataCode])
 * constraint in schema.prisma actually prevents duplicate unlocks under
 * concurrent requests, which a fake repository could never demonstrate
 * (there's no real race to protect against in memory).
 *
 * Requires the schema to already be migrated (`npx prisma migrate deploy`)
 * against the DATABASE_URL in .env before running.
 */
describe("PrismaCardRepository (DB race safety)", () => {
  const repository = new PrismaCardRepository(prisma);
  let userId: string;
  let airportIataCode: string;

  beforeEach(async () => {
    userId = randomUUID();
    airportIataCode = "T" + randomUUID().slice(0, 2).toUpperCase();

    await prisma.user.create({ data: { id: userId } });
    await prisma.airport.create({
      data: {
        iataCode: airportIataCode,
        icaoCode: "X" + airportIataCode,
        name: "Test Airport",
        city: "Test City",
        country: "Testland",
        latitude: 0,
        longitude: 0,
        timeZone: "UTC",
      },
    });
  });

  afterEach(async () => {
    await prisma.userAirportCard.deleteMany({ where: { userId } });
    await prisma.airport.delete({ where: { iataCode: airportIataCode } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("lets exactly one of two concurrent unlock attempts for the same (user, airport) succeed", async () => {
    const now = new Date();

    const [first, second] = await Promise.all([
      repository.tryUnlockAirportCard(userId, airportIataCode, now),
      repository.tryUnlockAirportCard(userId, airportIataCode, now),
    ]);

    const successCount = [first, second].filter(Boolean).length;
    expect(successCount).toBe(1);

    const rows = await prisma.userAirportCard.findMany({ where: { userId, airportIataCode } });
    expect(rows).toHaveLength(1);
  });

  it("a third attempt after the card is already owned correctly reports 'not new'", async () => {
    const now = new Date();
    const first = await repository.tryUnlockAirportCard(userId, airportIataCode, now);
    const repeat = await repository.tryUnlockAirportCard(userId, airportIataCode, now);

    expect(first).toBe(true);
    expect(repeat).toBe(false);

    const rows = await prisma.userAirportCard.findMany({ where: { userId, airportIataCode } });
    expect(rows).toHaveLength(1);
  });
});
