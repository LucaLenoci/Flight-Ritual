import { AircraftRegistration } from "../shared/aircraft-registration";
import { AircraftType } from "./aircraft-type";

export class Aircraft {
  constructor(
    readonly registration: AircraftRegistration,
    readonly type: AircraftType,
    readonly operatorIataCode: string | null,
    readonly manufactureDate: Date | null,
  ) {}

  /** Age in whole years as of a given reference instant. Null when manufacture date is unknown. */
  ageYearsAsOf(referenceDate: Date): number | null {
    if (!this.manufactureDate) return null;
    let years = referenceDate.getUTCFullYear() - this.manufactureDate.getUTCFullYear();
    const hasNotHadBirthdayYet =
      referenceDate.getUTCMonth() < this.manufactureDate.getUTCMonth() ||
      (referenceDate.getUTCMonth() === this.manufactureDate.getUTCMonth() &&
        referenceDate.getUTCDate() < this.manufactureDate.getUTCDate());
    if (hasNotHadBirthdayYet) years -= 1;
    return Math.max(0, years);
  }
}
