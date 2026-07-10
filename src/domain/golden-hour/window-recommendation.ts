export enum WindowSide {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  EITHER = "EITHER",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum RecommendationConfidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export class WindowRecommendation {
  constructor(
    readonly side: WindowSide,
    readonly confidence: RecommendationConfidence,
    readonly sunElevationDeg: number,
    readonly reason: string,
    readonly bestMomentUtc: Date | null,
  ) {}

  static notApplicable(reason: string): WindowRecommendation {
    return new WindowRecommendation(WindowSide.NOT_APPLICABLE, RecommendationConfidence.LOW, NaN, reason, null);
  }
}
