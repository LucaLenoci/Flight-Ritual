import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "../../../../infrastructure/composition-root";
import { checkRateLimit, clientKeyFrom } from "../../_lib/rate-limit";
import { serializeFlightMemory } from "../../_lib/serializers";
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

    const { recordCompletedFlight } = getContainer();
    const memory = await recordCompletedFlight.execute(userId, flightId, parsed.note ?? null);

    return NextResponse.json({ memory: serializeFlightMemory(memory) }, { status: 201 });
  });
}
