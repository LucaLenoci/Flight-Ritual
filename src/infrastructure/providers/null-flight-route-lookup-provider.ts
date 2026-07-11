import { FlightRouteLookupProvider, FlightRouteLookupResult } from "../../application/ports/flight-route-lookup-provider";

/**
 * Phase-1 implementation of FlightRouteLookupProvider: always reports "not
 * found." This is deliberate, not a placeholder bug — no free, keyless,
 * reliable open-data source exists for "flight number + arbitrary past date
 * -> route + aircraft type" (see the port's doc comment). Wiring in a real
 * provider later (should one become available/acceptable) means adding a
 * new adapter here and swapping it in composition-root.ts; nothing above
 * this port needs to change.
 */
export class NullFlightRouteLookupProvider implements FlightRouteLookupProvider {
  async lookup(): Promise<FlightRouteLookupResult | null> {
    return null;
  }
}
