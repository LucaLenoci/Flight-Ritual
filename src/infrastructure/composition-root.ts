import { randomUUID } from "node:crypto";
import { GetUserCardAlbumUseCase } from "../application/cards/get-user-card-album";
import { UnlockCardsForFlightUseCase } from "../application/cards/unlock-cards-for-flight";
import { EnrichFlightUseCase } from "../application/flight-enrichment/enrich-flight";
import { GetFlightLogUseCase } from "../application/flight-log/get-flight-log";
import { SaveLoggedFlightUseCase } from "../application/flight-log/save-logged-flight";
import { SystemClock } from "../application/ports/clock";
import { GetUserStatisticsUseCase } from "../application/statistics/get-user-statistics";
import { PrismaCardRepository } from "./persistence/prisma-card-repository";
import { PrismaFlightLogRepository } from "./persistence/prisma-flight-log-repository";
import { prisma } from "./persistence/prisma-client";
import { NullFlightRouteLookupProvider } from "./providers/null-flight-route-lookup-provider";
import { PrismaAircraftTypeReferenceProvider } from "./providers/prisma-aircraft-type-reference-provider";
import { PrismaAirlineReferenceProvider } from "./providers/prisma-airline-reference-provider";
import { PrismaAirportReferenceProvider } from "./providers/prisma-airport-reference-provider";
import { PrismaCardCatalogProvider } from "./providers/prisma-card-catalog-provider";

/**
 * Composition root: the one place infrastructure implementations are wired
 * to application ports. API routes depend on this module, never on concrete
 * infrastructure classes directly — swapping the reference data source or
 * persistence technology only means changing wiring here. In particular,
 * FlightRouteLookupProvider is wired to NullFlightRouteLookupProvider today
 * (see that file's doc comment on why); replacing it with a real provider
 * later is a one-line change here.
 */
const globalForContainer = globalThis as unknown as { aloftContainer?: ReturnType<typeof buildContainer> };

function buildContainer() {
  const clock = new SystemClock();
  const flightLogRepository = new PrismaFlightLogRepository(prisma);
  const cardRepository = new PrismaCardRepository(prisma);
  const cardCatalogProvider = new PrismaCardCatalogProvider(prisma);
  const airportReferenceProvider = new PrismaAirportReferenceProvider(prisma);
  const airlineReferenceProvider = new PrismaAirlineReferenceProvider(prisma);
  const aircraftTypeReferenceProvider = new PrismaAircraftTypeReferenceProvider(prisma);
  const flightRouteLookupProvider = new NullFlightRouteLookupProvider();

  return {
    clock,
    airportReferenceProvider,
    airlineReferenceProvider,
    aircraftTypeReferenceProvider,
    enrichFlight: new EnrichFlightUseCase(airlineReferenceProvider, flightRouteLookupProvider),
    saveLoggedFlight: new SaveLoggedFlightUseCase(
      flightLogRepository,
      airportReferenceProvider,
      airlineReferenceProvider,
      aircraftTypeReferenceProvider,
      flightRouteLookupProvider,
      clock,
      randomUUID,
    ),
    getFlightLog: new GetFlightLogUseCase(flightLogRepository, cardRepository),
    getUserStatistics: new GetUserStatisticsUseCase(flightLogRepository),
    unlockCardsForFlight: new UnlockCardsForFlightUseCase(cardRepository, flightLogRepository, clock),
    getUserCardAlbum: new GetUserCardAlbumUseCase(cardRepository, cardCatalogProvider),
  };
}

export function getContainer() {
  if (!globalForContainer.aloftContainer) {
    globalForContainer.aloftContainer = buildContainer();
  }
  return globalForContainer.aloftContainer;
}
