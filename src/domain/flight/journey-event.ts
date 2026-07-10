export enum JourneyEventType {
  SCHEDULED = "SCHEDULED",
  GATE_ASSIGNED = "GATE_ASSIGNED",
  GATE_CHANGED = "GATE_CHANGED",
  DELAY_UPDATED = "DELAY_UPDATED",
  BOARDING_STARTED = "BOARDING_STARTED",
  DEPARTED = "DEPARTED",
  TAKEOFF = "TAKEOFF",
  CRUISE_REACHED = "CRUISE_REACHED",
  DESCENT_STARTED = "DESCENT_STARTED",
  LANDED = "LANDED",
  ARRIVED_AT_GATE = "ARRIVED_AT_GATE",
  CANCELLED = "CANCELLED",
  DIVERTED = "DIVERTED",
}

/** Event types that can legitimately recur for the same flight, each occurrence carrying a new value. */
const REPEATABLE_EVENT_TYPES: ReadonlySet<JourneyEventType> = new Set([
  JourneyEventType.GATE_CHANGED,
  JourneyEventType.DELAY_UPDATED,
]);

const SINGLETON_SEQUENCE_KEY = "0";

export interface JourneyEventDetail {
  gate?: string;
  delayMinutes?: number;
  [key: string]: unknown;
}

/**
 * A single occurrence in a flight's journey. `sequenceKey` is the identity
 * discriminator that makes ingestion idempotent: for one-shot events (e.g.
 * TAKEOFF) it's constant, so re-processing the same event is a no-op upsert;
 * for repeatable events (GATE_CHANGED, DELAY_UPDATED) it's derived from the
 * new value, so re-processing an unchanged value is also a no-op, but an
 * actual change produces a genuinely new event.
 */
export class JourneyEvent {
  private constructor(
    readonly flightId: string,
    readonly type: JourneyEventType,
    readonly sequenceKey: string,
    readonly occurredAtUtc: Date,
    readonly detail: JourneyEventDetail,
  ) {}

  static create(
    flightId: string,
    type: JourneyEventType,
    occurredAtUtc: Date,
    detail: JourneyEventDetail = {},
  ): JourneyEvent {
    const sequenceKey = REPEATABLE_EVENT_TYPES.has(type)
      ? deriveSequenceKey(type, detail)
      : SINGLETON_SEQUENCE_KEY;
    return new JourneyEvent(flightId, type, sequenceKey, occurredAtUtc, detail);
  }

  /** Stable identity for deduplication: same flight + type + sequenceKey is the same event. */
  idempotencyKey(): string {
    return `${this.flightId}:${this.type}:${this.sequenceKey}`;
  }
}

function deriveSequenceKey(type: JourneyEventType, detail: JourneyEventDetail): string {
  switch (type) {
    case JourneyEventType.GATE_CHANGED:
      return `gate:${detail.gate ?? "unknown"}`;
    case JourneyEventType.DELAY_UPDATED:
      return `delay:${detail.delayMinutes ?? 0}`;
    default:
      return SINGLETON_SEQUENCE_KEY;
  }
}
