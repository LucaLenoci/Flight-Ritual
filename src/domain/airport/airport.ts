import { Coordinates } from "../shared/coordinates";
import { IataCode, IcaoAirportCode } from "../shared/airport-code";

export class Airport {
  constructor(
    readonly iataCode: IataCode,
    readonly icaoCode: IcaoAirportCode,
    readonly name: string,
    readonly city: string,
    readonly country: string,
    readonly coordinates: Coordinates,
    readonly timeZone: string,
    readonly continent: string | null = null,
  ) {}
}
