import { InvalidValueError } from "../../domain/shared/errors";
import { LoggedFlight } from "../../domain/flight-log/logged-flight";
import { CardUnlockResult, UnlockCardsForFlightUseCase } from "../cards/unlock-cards-for-flight";
import { UnknownReferenceEntityError } from "../errors";
import { SaveLoggedFlightInput, SaveLoggedFlightUseCase } from "./save-logged-flight";

const GENERIC_ROW_ERROR = "Couldn't save this flight. Please check its details and try again.";

/** Only known, already user-safe validation error messages are surfaced per-row; anything else (e.g. a transient infra failure) falls back to a generic message rather than leaking internals. */
function toRowErrorMessage(error: unknown): string {
  if (error instanceof InvalidValueError || error instanceof UnknownReferenceEntityError) {
    return error.message;
  }
  return GENERIC_ROW_ERROR;
}

export interface BulkSaveRowResult {
  index: number;
  success: boolean;
  flight?: LoggedFlight;
  cardUnlocks?: CardUnlockResult;
  error?: string;
}

/**
 * Saves many past flights in one request — the entry point for building up
 * a travel history in bulk rather than one flight at a time. Each row is
 * saved independently: one invalid row (an unknown airport/airline code, a
 * malformed flight number) never aborts the rest of the batch, since losing
 * 49 valid rows because row 12 had a typo would be a hostile UX. Every row
 * still goes through the exact same validation and card-unlock evaluation
 * as a single-flight save — bulk import is not a lower-trust shortcut.
 */
export class BulkSaveLoggedFlightsUseCase {
  constructor(
    private readonly saveLoggedFlight: SaveLoggedFlightUseCase,
    private readonly unlockCardsForFlight: UnlockCardsForFlightUseCase,
  ) {}

  async execute(userId: string, inputs: readonly SaveLoggedFlightInput[]): Promise<BulkSaveRowResult[]> {
    const results: BulkSaveRowResult[] = [];

    for (const [index, input] of inputs.entries()) {
      try {
        const flight = await this.saveLoggedFlight.execute(userId, input);
        const cardUnlocks = await this.unlockCardsForFlight.execute(userId, flight.id);
        results.push({ index, success: true, flight, cardUnlocks });
      } catch (error) {
        results.push({ index, success: false, error: toRowErrorMessage(error) });
      }
    }

    return results;
  }
}
