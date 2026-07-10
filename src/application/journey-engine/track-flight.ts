import { Flight } from "../../domain/flight/flight";
import { FlightPhase } from "../../domain/flight/flight-phase";
import { JourneyEvent, JourneyEventDetail, JourneyEventType } from "../../domain/flight/journey-event";
import {
  applyJourneyEvent,
  synthesizeForwardEventTypes,
} from "../../domain/flight/journey-state-machine";
import { IllegalStateTransitionError } from "../../domain/shared/errors";
import { FlightNotFoundError } from "../errors";
import { FlightDataProvider, FlightDataProviderError, ProviderFlightSnapshot } from "../ports/flight-data-provider";
import { FlightRepository } from "../ports/flight-repository";
import { buildFlightFromSnapshot } from "./build-flight-from-snapshot";
import { mapProviderStatusToPhase } from "./map-provider-status";

export interface TrackFlightResult {
  flight: Flight;
  /** Events newly recorded by this call — the caller (e.g. an API route) uses this to decide whether to evaluate a Runway Moment. */
  newEvents: JourneyEvent[];
  /** True when live data couldn't be refreshed and we're serving the last known state instead of failing outright. */
  degraded: boolean;
  /** The phase the flight was in before this call, so callers can detect a phase transition without a second lookup. */
  previousPhase: FlightPhase;
}

interface PendingEvent {
  type: JourneyEventType;
  detail?: JourneyEventDetail;
  /** Ground-truth timestamp when the provider gives us one (e.g. actualDepartureUtc); falls back to observedAtUtc otherwise. */
  occurredAtUtc?: Date;
}

/**
 * Journey Engine core use case: refreshes a flight's tracked state from the
 * live data provider, detects what changed since we last saw it, and records
 * the resulting journey events idempotently. Safe to call repeatedly on a
 * polling interval — re-processing an unchanged snapshot produces zero new
 * events.
 */
export class TrackFlightUseCase {
  constructor(
    private readonly flightDataProvider: FlightDataProvider,
    private readonly flightRepository: FlightRepository,
    private readonly generateId: () => string,
  ) {}

  async execute(flightNumber: string, scheduledDepartureUtc: Date): Promise<TrackFlightResult> {
    const existing = await this.flightRepository.findByFlightNumberAndDeparture(
      flightNumber,
      scheduledDepartureUtc,
    );

    const snapshot = await this.fetchSnapshotOrDegrade(flightNumber, scheduledDepartureUtc, existing);
    if ("degradedResult" in snapshot) return snapshot.degradedResult;

    const flightId = existing?.id ?? this.generateId();
    const currentPhase = existing?.phase ?? FlightPhase.SCHEDULED;
    const targetPhase = mapProviderStatusToPhase(snapshot.status);

    // Pure computation first: decide which events *should* exist and what
    // phase they resolve to, without touching the database yet.
    const pendingEvents: PendingEvent[] = [
      ...this.computeGateEvent(existing?.gate ?? null, snapshot.gate),
      { type: JourneyEventType.DELAY_UPDATED, detail: { delayMinutes: snapshot.delayMinutes } },
    ];
    const { resolvedPhase, phaseEvents } = this.computePhaseAdvance(currentPhase, targetPhase);
    pendingEvents.push(...this.attachGroundTruthTimestamps(phaseEvents, snapshot));

    // The Flight row must exist before JourneyEvent rows can reference it
    // (foreign key), so persist the flight first, then the events.
    const flight = buildFlightFromSnapshot(snapshot, {
      existingFlightId: flightId,
      phaseOverride: resolvedPhase,
      aircraftAssignment: existing?.aircraftAssignment,
      newFlightId: this.generateId,
    });
    await this.flightRepository.save(flight);

    const newEvents: JourneyEvent[] = [];
    for (const pending of pendingEvents) {
      const occurredAtUtc = pending.occurredAtUtc ?? snapshot.observedAtUtc;
      const event = JourneyEvent.create(flightId, pending.type, occurredAtUtc, pending.detail);
      if (await this.flightRepository.appendJourneyEventIfNew(event)) newEvents.push(event);
    }

    return { flight, newEvents, degraded: false, previousPhase: currentPhase };
  }

  private async fetchSnapshotOrDegrade(
    flightNumber: string,
    scheduledDepartureUtc: Date,
    existing: Flight | null,
  ): Promise<ProviderFlightSnapshot | { degradedResult: TrackFlightResult }> {
    try {
      const snapshot = await this.flightDataProvider.fetchSnapshot(flightNumber, scheduledDepartureUtc);
      if (snapshot) return snapshot;
    } catch (error) {
      if (!(error instanceof FlightDataProviderError)) throw error;
      if (existing) return { degradedResult: this.degradedResult(existing) };
      throw error;
    }

    if (existing) return { degradedResult: this.degradedResult(existing) };
    throw new FlightNotFoundError(flightNumber, scheduledDepartureUtc);
  }

  private degradedResult(existing: Flight): TrackFlightResult {
    return { flight: existing, newEvents: [], degraded: true, previousPhase: existing.phase };
  }

  /**
   * When the provider snapshot gives us a real timestamp for an event (e.g.
   * actualDepartureUtc), use it instead of the poll's observation time — this
   * is what keeps a freshly-tracked flight's catch-up events from all
   * bunching up at "now" when we start tracking it mid-journey.
   */
  private attachGroundTruthTimestamps(events: PendingEvent[], snapshot: ProviderFlightSnapshot): PendingEvent[] {
    return events.map((event) => {
      if (event.type === JourneyEventType.DEPARTED && snapshot.actualDepartureUtc) {
        return { ...event, occurredAtUtc: snapshot.actualDepartureUtc };
      }
      if (
        (event.type === JourneyEventType.LANDED || event.type === JourneyEventType.ARRIVED_AT_GATE) &&
        snapshot.actualArrivalUtc
      ) {
        return { ...event, occurredAtUtc: snapshot.actualArrivalUtc };
      }
      return event;
    });
  }

  private computeGateEvent(previousGate: string | null, newGate: string | null): PendingEvent[] {
    if (!newGate || newGate === previousGate) return [];
    const type = previousGate ? JourneyEventType.GATE_CHANGED : JourneyEventType.GATE_ASSIGNED;
    return [{ type, detail: { gate: newGate } }];
  }

  /** Pure: resolves the direct absorbing-state transition (CANCELLED/DIVERTED) or the forward walk through intermediate phases. */
  private computePhaseAdvance(
    currentPhase: FlightPhase,
    targetPhase: FlightPhase,
  ): { resolvedPhase: FlightPhase; phaseEvents: PendingEvent[] } {
    if (targetPhase === FlightPhase.CANCELLED || targetPhase === FlightPhase.DIVERTED) {
      const type = targetPhase === FlightPhase.CANCELLED ? JourneyEventType.CANCELLED : JourneyEventType.DIVERTED;
      try {
        const resolvedPhase = applyJourneyEvent(currentPhase, type);
        return { resolvedPhase, phaseEvents: [{ type }] };
      } catch (error) {
        if (error instanceof IllegalStateTransitionError) return { resolvedPhase: currentPhase, phaseEvents: [] };
        throw error;
      }
    }

    let phase = currentPhase;
    const phaseEvents: PendingEvent[] = [];
    for (const type of synthesizeForwardEventTypes(currentPhase, targetPhase)) {
      phase = applyJourneyEvent(phase, type);
      phaseEvents.push({ type });
    }
    return { resolvedPhase: phase, phaseEvents };
  }
}
