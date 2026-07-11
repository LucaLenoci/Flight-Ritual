import { AirplaneTilt } from "@phosphor-icons/react/dist/ssr";
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
      {/* Sky gradient owns Home — the one hero background on this screen. Dark mode swaps to a deeper
          navy-to-blue variant (never the light gradient), so the white text stays legible. */}
      <div className="animate-rise-fade mb-8 rounded-3xl bg-gradient-sky-day px-6 py-10 dark:bg-gradient-sky-night sm:px-10">
        <p className="font-mono text-xs uppercase tracking-eyebrow text-on-gradient/80">Live &amp; Upcoming</p>
        <h1 className="mt-2 font-display text-3xl italic text-on-gradient sm:text-4xl">Your journeys, in the air</h1>
        <p className="mt-2 max-w-xl text-sm text-on-gradient/90">
          Track a flight to unlock its Aircraft Reveal, Golden Hour Window, and Runway Moment — and collect a
          card for every airport, aircraft, and airline you fly.
        </p>
      </div>

      {flights.length === 0 ? (
        <EmptyState
          icon={<AirplaneTilt aria-hidden="true" />}
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
