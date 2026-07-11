import Link from "next/link";
import { AddFlightForm } from "../../components/flight-log/add-flight-form";

export default function AddFlightPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl italic text-text-primary">Log a Flight</h1>
          <p className="mt-1 text-sm text-text-secondary">Enter your flight number and date to add it to your history.</p>
        </div>
        <Link href="/add-flight/bulk" className="mt-1 whitespace-nowrap text-sm text-sky-600 hover:underline">
          Import several at once
        </Link>
      </div>
      <div className="mt-6">
        <AddFlightForm />
      </div>
    </div>
  );
}
