import { Aircraft } from "../../domain/aircraft/aircraft";
import { AircraftAssignment, AssignmentConfidence, AssignmentSource } from "../../domain/aircraft/aircraft-assignment";
import { AircraftType } from "../../domain/aircraft/aircraft-type";
import { AircraftRegistration } from "../../domain/shared/aircraft-registration";
import { Clock } from "../ports/clock";
import {
  AircraftDataProvider,
  AircraftDataProviderError,
  ProviderAircraftDetails,
} from "../ports/aircraft-data-provider";

function toAircraft(details: ProviderAircraftDetails): Aircraft {
  return new Aircraft(
    AircraftRegistration.create(details.registration),
    new AircraftType(details.type.icaoTypeCode, details.type.manufacturer, details.type.model, details.type.facts),
    details.operatorIataCode,
    details.manufactureDate,
  );
}

/**
 * Aircraft Reveal enrichment: resolves which aircraft will operate a flight,
 * falling back through progressively less certain sources rather than
 * failing outright. This graceful degradation is the whole point — most
 * flights don't have a live-confirmed tail number until hours before
 * departure, so the UI needs a meaningful (if lower-confidence) answer
 * before then, and a clean "not yet known" state when even that's unavailable.
 */
export class EnrichAircraftAssignmentUseCase {
  constructor(
    private readonly provider: AircraftDataProvider,
    private readonly clock: Clock,
  ) {}

  async execute(flightNumber: string, departureDateUtc: Date): Promise<AircraftAssignment | null> {
    const confirmed = await this.tryFetch(() =>
      this.provider.fetchConfirmedAssignment(flightNumber, departureDateUtc),
    );
    if (confirmed) {
      return new AircraftAssignment(
        toAircraft(confirmed),
        AssignmentSource.PROVIDER_CONFIRMED,
        AssignmentConfidence.HIGH,
        this.clock.now(),
      );
    }

    const historical = await this.tryFetch(() => this.provider.fetchHistoricalPattern(flightNumber));
    if (historical) {
      return new AircraftAssignment(
        toAircraft(historical),
        AssignmentSource.HISTORICAL_PATTERN,
        AssignmentConfidence.LOW,
        this.clock.now(),
      );
    }

    return null;
  }

  /** Provider failures degrade to "try the next source" rather than failing the whole enrichment. */
  private async tryFetch<T>(fetch: () => Promise<T | null>): Promise<T | null> {
    try {
      return await fetch();
    } catch (error) {
      if (error instanceof AircraftDataProviderError) return null;
      throw error;
    }
  }
}
