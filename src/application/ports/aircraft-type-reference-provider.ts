import { AircraftType } from "../../domain/aircraft/aircraft-type";

/** Reference lookup over the curated AircraftType catalog (model/type, never tail number). */
export interface AircraftTypeReferenceProvider {
  findByIcaoTypeCode(icaoTypeCode: string): Promise<AircraftType | null>;
  listAll(): Promise<AircraftType[]>;
}
