import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "../../../../infrastructure/composition-root";
import { checkRateLimit, clientKeyFrom } from "../../_lib/rate-limit";
import { serializeCardUnlockResult, serializeFlightMemory } from "../../_lib/serializers";
import { withSession } from "../../_lib/with-session";

const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const bodySchema = z.object({
  note: z.string().trim().max(500).nullable().optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ flightId: string }> }) {
  const { flightId } = await context.params;

  const rateLimit = checkRateLimit(`legacy:save:${clientKeyFrom(request)}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  return withSession(request, async (userId) => {
    const rawBody = await request.text();
    const parsed = bodySchema.parse(rawBody ? JSON.parse(rawBody) : {});

    const { recordCompletedFlight, unlockCardsForFlight } = getContainer();
    const memory = await recordCompletedFlight.execute(userId, flightId, parsed.note ?? null);

    // Card unlock evaluation runs as part of flight-completion processing.
    // It's independently idempotent (DB unique constraint), so re-saving an
    // already-saved flight is safe and simply yields zero new cards rather
    // than re-firing the "new card" celebration.
    const unlockResult = await unlockCardsForFlight.execute(userId, flightId);

    return NextResponse.json(
      { memory: serializeFlightMemory(memory), cardUnlocks: serializeCardUnlockResult(unlockResult) },
      { status: 201 },
    );
  });
}
