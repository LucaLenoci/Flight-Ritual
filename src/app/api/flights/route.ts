import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "../../../infrastructure/composition-root";
import { toErrorResponse } from "../_lib/error-response";
import { checkRateLimit, clientKeyFrom } from "../_lib/rate-limit";

const RATE_LIMIT = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(`flights:list:${clientKeyFrom(request)}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const { flightDataProvider } = getContainer();
    const flights = flightDataProvider.listTrackableFlights().map((f) => ({
      flightNumber: f.flightNumber,
      scheduledDepartureUtc: f.scheduledDepartureUtc.toISOString(),
      originIataCode: f.originIataCode,
      destinationIataCode: f.destinationIataCode,
      airlineName: f.airlineName,
    }));
    return NextResponse.json({ flights });
  } catch (error) {
    return toErrorResponse(error);
  }
}
