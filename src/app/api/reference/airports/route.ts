import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "../../../../infrastructure/composition-root";
import { checkRateLimit, clientKeyFrom } from "../../_lib/rate-limit";
import { serializeAirport } from "../../_lib/serializers";
import { withSession } from "../../_lib/with-session";

const RATE_LIMIT = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

const querySchema = z.object({ q: z.string().trim().min(1).max(100) });

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(`reference:airports:${clientKeyFrom(request)}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  return withSession(request, async () => {
    const { q } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const { airportReferenceProvider } = getContainer();
    const airports = await airportReferenceProvider.search(q, 10);
    return NextResponse.json({ airports: airports.map(serializeAirport) });
  });
}
