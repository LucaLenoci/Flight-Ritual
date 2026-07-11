import { AddFlightForm } from "../../components/flight-log/add-flight-form";

export default function AddFlightPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">Log a Flight</h1>
      <p className="mt-1 text-sm text-text-secondary">Enter your flight number and date to add it to your history.</p>
      <div className="mt-6">
        <AddFlightForm />
      </div>
    </div>
  );
}
