import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlightNumber } from "../../../../domain/shared/flight-number";
import { getContainer } from "../../../../infrastructure/composition-root";
import { toErrorResponse } from "../../_lib/error-response";
import { checkRateLimit, clientKeyFrom } from "../../_lib/rate-limit";
import {
  serializeFlight,
  serializeJourneyEvent,
  serializeRunwayMoment,
  serializeWindowRecommendation,
} from "../../_lib/serializers";

const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const querySchema = z.object({
  departure: z.string().datetime().optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ flightNumber: string }> }) {
  const { flightNumber: rawFlightNumber } = await context.params;

  const rateLimit = checkRateLimit(
    `flights:detail:${clientKeyFrom(request)}`,
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const flightNumber = FlightNumber.create(rawFlightNumber).toString();
    const { departure } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

    const container = getContainer();
    const scheduledDepartureUtc = departure
      ? new Date(departure)
      : await resolveDepartureFromTrackableList(flightNumber, container.flightDataProvider);

    if (!scheduledDepartureUtc) {
      return NextResponse.json({ error: `No trackable flight found for ${flightNumber}` }, { status: 404 });
    }

    const trackResult = await container.trackFlight.execute(flightNumber, scheduledDepartureUtc);
    let flight = trackResult.flight;

    if (!flight.aircraftAssignment) {
      const assignment = await container.enrichAircraftAssignment.execute(flightNumber, scheduledDepartureUtc);
      if (assignment) {
        flight = flight.withAircraftAssignment(assignment);
        await container.flightRepository.save(flight);
      }
    }

    const goldenHour = container.recommendWindow.execute(flight);
    const runwayMoment = container.runwayMoment.forTransition(trackResult.previousPhase, flight);
    const events = await container.flightRepository.listJourneyEvents(flight.id);

    return NextResponse.json({
      flight: serializeFlight(flight),
      events: events.map(serializeJourneyEvent),
      goldenHour: serializeWindowRecommendation(goldenHour),
      runwayMoment: runwayMoment ? serializeRunwayMoment(runwayMoment) : null,
      degraded: trackResult.degraded,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function resolveDepartureFromTrackableList(
  flightNumber: string,
  flightDataProvider: ReturnType<typeof getContainer>["flightDataProvider"],
): Promise<Date | null> {
  const match = flightDataProvider
    .listTrackableFlights()
    .find((f) => f.flightNumber === flightNumber);
  return match?.scheduledDepartureUtc ?? null;
}
