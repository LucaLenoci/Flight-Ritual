import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "../../../../infrastructure/composition-root";
import { checkRateLimit, clientKeyFrom } from "../../_lib/rate-limit";
import { serializeEnrichmentPreview } from "../../_lib/serializers";
import { withSession } from "../../_lib/with-session";

const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const enrichSchema = z.object({
  flightNumber: z.string().trim().min(2).max(10),
  flightDate: z.string().datetime().or(z.string().date()),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`flight-log:enrich:${clientKeyFrom(request)}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  return withSession(request, async () => {
    const rawBody = await request.text();
    const input = enrichSchema.parse(rawBody ? JSON.parse(rawBody) : {});

    const { enrichFlight } = getContainer();
    const preview = await enrichFlight.execute(input.flightNumber, new Date(input.flightDate));

    return NextResponse.json(serializeEnrichmentPreview(preview));
  });
}
