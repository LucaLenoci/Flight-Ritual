/**
 * Per-field origin of a LoggedFlight's data: whether it was resolved
 * automatically (from a flight number or other free open-data enrichment)
 * or supplied/corrected by the user. Kept separate from the field values
 * themselves so manual corrections stay explicit and traceable rather than
 * silently indistinguishable from enriched data — a UI can render "you
 * confirmed this" vs. "we found this" differently, and enrichment logic can
 * refuse to silently overwrite a field the user already corrected.
 */
export enum FieldProvenance {
  ENRICHED = "ENRICHED",
  USER_PROVIDED = "USER_PROVIDED",
}

export interface LoggedFlightProvenance {
  airline: FieldProvenance;
  origin: FieldProvenance;
  destination: FieldProvenance;
  aircraftType: FieldProvenance;
}
