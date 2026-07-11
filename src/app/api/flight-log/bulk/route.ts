import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "../../../../infrastructure/composition-root";
import { serializeCardUnlockResult, serializeLoggedFlight } from "../../_lib/serializers";
import { checkRateLimit, clientKeyFrom } from "../../_lib/rate-limit";
import { withSession } from "../../_lib/with-session";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ROWS_PER_REQUEST = 100;

const rowSchema = z.object({
  flightNumber: z.string().trim().min(2).max(10),
  flightDate: z.string().datetime().or(z.string().date()),
  originIataCode: z.string().trim().min(2).max(3),
  destinationIataCode: z.string().trim().min(2).max(3),
  airlineIataCode: z.string().trim().min(2).max(3),
  aircraftTypeIcaoCode: z.string().trim().min(1).max(10).nullable().optional(),
  tailNumber: z.string().trim().max(20).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

const bulkSchema = z.object({
  flights: z.array(rowSchema).min(1).max(MAX_ROWS_PER_REQUEST),
});

/**
 * Bulk historical import: saves many past flights in one request, each
 * validated and unlock-evaluated exactly like a single-flight save (see
 * BulkSaveLoggedFlightsUseCase) — a lower request-per-minute limit than the
 * single-flight endpoint reflects the larger unit of work per call, not a
 * lower trust bar per row.
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`flight-log:bulk:${clientKeyFrom(request)}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  return withSession(request, async (userId) => {
    const rawBody = await request.text();
    const input = bulkSchema.parse(rawBody ? JSON.parse(rawBody) : {});

    const { bulkSaveLoggedFlights } = getContainer();
    const rowResults = await bulkSaveLoggedFlights.execute(
      userId,
      input.flights.map((row) => ({
        flightNumber: row.flightNumber,
        flightDate: new Date(row.flightDate),
        originIataCode: row.originIataCode,
        destinationIataCode: row.destinationIataCode,
        airlineIataCode: row.airlineIataCode,
        aircraftTypeIcaoCode: row.aircraftTypeIcaoCode ?? null,
        tailNumber: row.tailNumber ?? null,
        note: row.note ?? null,
      })),
    );

    return NextResponse.json({
      results: rowResults.map((row) => ({
        index: row.index,
        success: row.success,
        flight: row.flight ? serializeLoggedFlight(row.flight) : null,
        cardUnlocks: row.cardUnlocks ? serializeCardUnlockResult(row.cardUnlocks) : null,
        error: row.error ?? null,
      })),
    });
  });
}
