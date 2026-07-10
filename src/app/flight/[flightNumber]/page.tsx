import { FlightDetailView } from "../../../components/flight/flight-detail-view";

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}) {
  const { flightNumber } = await params;
  return <FlightDetailView flightNumber={flightNumber} />;
}
