export enum RunwayMomentPhase {
  TAKEOFF = "TAKEOFF",
  LANDING = "LANDING",
}

export class RunwayMoment {
  constructor(
    readonly flightId: string,
    readonly phase: RunwayMomentPhase,
    readonly occurredAtUtc: Date,
    readonly headline: string,
    readonly subtext: string,
  ) {}
}
