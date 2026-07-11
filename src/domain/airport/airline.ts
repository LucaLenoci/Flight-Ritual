import { IataCode, IcaoAirlineDesignator } from "../shared/airport-code";

export class Airline {
  constructor(
    readonly iataCode: IataCode,
    readonly icaoDesignator: IcaoAirlineDesignator,
    readonly name: string,
  ) {}
}
