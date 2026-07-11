import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "../../../infrastructure/composition-root";
import { checkRateLimit, clientKeyFrom } from "../_lib/rate-limit";
import { serializeCardUnlockResult, serializeLoggedFlight } from "../_lib/serializers";
import { withSession } from "../_lib/with-session";

const SAVE_RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const saveFlightSchema = z.object({
  flightNumber: z.string().trim().min(2).max(10),
  flightDate: z.string().datetime().or(z.string().date()),
  originIataCode: z.string().trim().min(2).max(3),
  destinationIataCode: z.string().trim().min(2).max(3),
  airlineIataCode: z.string().trim().min(2).max(3),
  aircraftTypeIcaoCode: z.string().trim().min(1).max(10).nullable().optional(),
  tailNumber: z.string().trim().max(20).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  return withSession(request, async (userId) => {
    const { getFlightLog } = getContainer();
    const entries = await getFlightLog.execute(userId);
    return NextResponse.json({
      flights: entries.map((entry) => ({ ...serializeLoggedFlight(entry.flight), unlocks: entry.unlocks })),
    });
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`flight-log:save:${clientKeyFrom(request)}`, SAVE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  return withSession(request, async (userId) => {
    const rawBody = await request.text();
    const input = saveFlightSchema.parse(rawBody ? JSON.parse(rawBody) : {});

    const { saveLoggedFlight, unlockCardsForFlight } = getContainer();
    const flight = await saveLoggedFlight.execute(userId, {
      flightNumber: input.flightNumber,
      flightDate: new Date(input.flightDate),
      originIataCode: input.originIataCode,
      destinationIataCode: input.destinationIataCode,
      airlineIataCode: input.airlineIataCode,
      aircraftTypeIcaoCode: input.aircraftTypeIcaoCode ?? null,
      tailNumber: input.tailNumber ?? null,
      note: input.note ?? null,
    });

    // Card unlock evaluation runs as part of saving a flight. It's
    // independently idempotent (DB unique constraint), so re-processing is
    // always safe and simply yields zero new cards on a repeat.
    const unlockResult = await unlockCardsForFlight.execute(userId, flight.id);

    return NextResponse.json(
      { flight: serializeLoggedFlight(flight), cardUnlocks: serializeCardUnlockResult(unlockResult) },
      { status: 201 },
    );
  });
}
