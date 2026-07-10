import { FlightCard, FlightCardData } from "../components/flight/flight-card";
import { EmptyState } from "../components/ui/empty-state";
import { getContainer } from "../infrastructure/composition-root";

export const dynamic = "force-dynamic";

async function loadBrowsableFlights(): Promise<FlightCardData[]> {
  const { flightDataProvider } = getContainer();
  const trackable = flightDataProvider.listTrackableFlights();

  const previews = await Promise.all(
    trackable.map((t) => flightDataProvider.fetchSnapshot(t.flightNumber, t.scheduledDepartureUtc)),
  );

  return previews
    .filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null)
    .map((snapshot) => ({
      flightNumber: snapshot.flightNumber,
      airlineName: snapshot.airline.name,
      originIataCode: snapshot.origin.iataCode,
      originTimeZone: snapshot.origin.timeZone,
      destinationIataCode: snapshot.destination.iataCode,
      scheduledDepartureUtc: snapshot.scheduledDepartureUtc.toISOString(),
      phase: snapshot.status,
      gate: snapshot.gate,
      delayMinutes: snapshot.delayMinutes,
    }));
}

export default async function HomePage() {
  const flights = await loadBrowsableFlights();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-altitude-400">Live &amp; upcoming</p>
        <h1 className="mt-2 font-display text-3xl text-mist-100 sm:text-4xl">Your journeys, in the air</h1>
        <p className="mt-2 max-w-xl text-sm text-mist-400">
          Track a flight to unlock its Aircraft Reveal, Golden Hour window, and Runway Moment — and save it
          to your Flight Legacy once it lands.
        </p>
      </div>

      {flights.length === 0 ? (
        <EmptyState
          icon="✈"
          title="No flights available right now"
          description="Check back shortly — new journeys appear here as they become trackable."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flights.map((flight) => (
            <FlightCard key={flight.flightNumber} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
