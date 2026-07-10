import { FlightPhase } from "../../domain/flight/flight-phase";
import { ProviderFlightStatus } from "../ports/flight-data-provider";

/**
 * Translates a provider's status vocabulary into our FlightPhase. Kept as an
 * explicit, isolated mapping (rather than reusing the same enum) so a future
 * adapter with a differently-shaped status model only has to change this one
 * function, not the journey engine itself.
 */
export function mapProviderStatusToPhase(status: ProviderFlightStatus): FlightPhase {
  switch (status) {
    case ProviderFlightStatus.SCHEDULED:
      return FlightPhase.SCHEDULED;
    case ProviderFlightStatus.BOARDING:
      return FlightPhase.BOARDING;
    case ProviderFlightStatus.DEPARTED:
      return FlightPhase.DEPARTED;
    case ProviderFlightStatus.AIRBORNE:
      return FlightPhase.AIRBORNE;
    case ProviderFlightStatus.DESCENDING:
      return FlightPhase.DESCENDING;
    case ProviderFlightStatus.LANDED:
      return FlightPhase.LANDED;
    case ProviderFlightStatus.ARRIVED:
      return FlightPhase.ARRIVED;
    case ProviderFlightStatus.CANCELLED:
      return FlightPhase.CANCELLED;
    case ProviderFlightStatus.DIVERTED:
      return FlightPhase.DIVERTED;
  }
}
