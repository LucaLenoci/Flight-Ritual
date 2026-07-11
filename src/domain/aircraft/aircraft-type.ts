/** Reference data for an aircraft model/type, shared across all tail numbers of that type. */
export class AircraftType {
  constructor(
    readonly icaoTypeCode: string,
    readonly manufacturer: string,
    readonly model: string,
    readonly facts: readonly string[],
    readonly cruiseSpeedKmh: number | null = null,
  ) {}
}
