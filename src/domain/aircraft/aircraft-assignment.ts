import { Aircraft } from "./aircraft";

/** How confidently we know which physical aircraft will operate a flight. */
export enum AssignmentSource {
  /** Live data provider confirmed the specific tail number. */
  PROVIDER_CONFIRMED = "PROVIDER_CONFIRMED",
  /** Inferred from the historical pattern of aircraft used on this flight number. */
  HISTORICAL_PATTERN = "HISTORICAL_PATTERN",
}

export enum AssignmentConfidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export class AircraftAssignment {
  constructor(
    readonly aircraft: Aircraft,
    readonly source: AssignmentSource,
    readonly confidence: AssignmentConfidence,
    readonly assignedAtUtc: Date,
  ) {}
}
