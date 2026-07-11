import { randomUUID } from "node:crypto";
import { EnrichAircraftAssignmentUseCase } from "../application/aircraft-enrichment/enrich-aircraft-assignment";
import { GetUserCardAlbumUseCase } from "../application/cards/get-user-card-album";
import { UnlockCardsForFlightUseCase } from "../application/cards/unlock-cards-for-flight";
import { RecommendWindowUseCase } from "../application/golden-hour-engine/recommend-window";
import { TrackFlightUseCase } from "../application/journey-engine/track-flight";
import { GetUserLegacyUseCase } from "../application/legacy-service/get-user-legacy";
import { RecordCompletedFlightUseCase } from "../application/legacy-service/record-completed-flight";
import { SystemClock } from "../application/ports/clock";
import { RunwayMomentService } from "../application/runway-moment/runway-moment-service";
import { MockAircraftDataProvider } from "./providers/mock-aircraft-data-provider";
import { MockCardCatalogProvider } from "./providers/mock-card-catalog-provider";
import { MockFlightDataProvider } from "./providers/mock-flight-data-provider";
import { PrismaCardRepository } from "./persistence/prisma-card-repository";
import { PrismaFlightRepository } from "./persistence/prisma-flight-repository";
import { PrismaLegacyRepository } from "./persistence/prisma-legacy-repository";
import { prisma } from "./persistence/prisma-client";

/**
 * Composition root: the one place infrastructure implementations are wired
 * to application ports. API routes depend on this module, never on concrete
 * infrastructure classes directly — swapping the flight data provider or
 * persistence technology only means changing wiring here.
 *
 * Held as module-level singletons (not per-request) so the mock providers'
 * anchor time — and therefore the demo's simulated flight timelines — stays
 * stable for the life of the server process.
 */
const globalForContainer = globalThis as unknown as { flightRitualContainer?: ReturnType<typeof buildContainer> };

function buildContainer() {
  const clock = new SystemClock();
  const flightDataProvider = new MockFlightDataProvider(clock);
  const aircraftDataProvider = new MockAircraftDataProvider(clock);
  const cardCatalogProvider = new MockCardCatalogProvider();
  const flightRepository = new PrismaFlightRepository(prisma);
  const legacyRepository = new PrismaLegacyRepository(prisma);
  const cardRepository = new PrismaCardRepository(prisma);

  return {
    clock,
    flightDataProvider,
    trackFlight: new TrackFlightUseCase(flightDataProvider, flightRepository, randomUUID),
    enrichAircraftAssignment: new EnrichAircraftAssignmentUseCase(aircraftDataProvider, clock),
    recommendWindow: new RecommendWindowUseCase(),
    runwayMoment: new RunwayMomentService(),
    recordCompletedFlight: new RecordCompletedFlightUseCase(flightRepository, legacyRepository, clock, randomUUID),
    getUserLegacy: new GetUserLegacyUseCase(legacyRepository),
    unlockCardsForFlight: new UnlockCardsForFlightUseCase(cardRepository, flightRepository, clock),
    getUserCardAlbum: new GetUserCardAlbumUseCase(cardRepository, cardCatalogProvider),
    flightRepository,
  };
}

export function getContainer() {
  if (!globalForContainer.flightRitualContainer) {
    globalForContainer.flightRitualContainer = buildContainer();
  }
  return globalForContainer.flightRitualContainer;
}
