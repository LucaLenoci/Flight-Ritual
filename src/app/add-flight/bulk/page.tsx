import { BulkImportForm } from "../../../components/flight-log/bulk-import-form";

export default function BulkImportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">Import Past Flights</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Add several flights at once using IATA/ICAO codes — great for building up your history in one go.
      </p>
      <div className="mt-6">
        <BulkImportForm />
      </div>
    </div>
  );
}
