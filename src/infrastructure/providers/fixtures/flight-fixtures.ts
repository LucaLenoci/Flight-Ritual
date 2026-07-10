import { ProviderAirlineRef, ProviderAirportRef } from "../../../application/ports/flight-data-provider";
import { ProviderAircraftType } from "../../../application/ports/aircraft-data-provider";
import { AIRCRAFT_TYPES } from "./aircraft-types";
import { AIRLINES, AIRPORTS } from "./reference-data";

export interface FlightFixtureDefinition {
  flightNumber: string;
  airline: ProviderAirlineRef;
  origin: ProviderAirportRef;
  destination: ProviderAirportRef;
  /** Scheduled departure, expressed as an offset from the provider's anchor time (construction time). Negative = already in the past. */
  departureOffsetMinutes: number;
  scheduledDurationMinutes: number;
  delayMinutes: number;
  /** Gate the flight will eventually be assigned; null means it never gets one in this fixture (used to demo the "not yet assigned" empty state). */
  gate: string | null;
  aircraft: {
    registration: string;
    type: ProviderAircraftType;
    operatorIataCode: string;
    manufactureDate: Date;
  };
}

/**
 * Seven flights spanning every phase of the journey and a range of route
 * lengths, so the app has a rich, immediately-explorable demo without a live
 * data subscription. Offsets are relative to server start time, so the
 * scenario is stable for the life of the process but phases still progress
 * naturally as real time passes.
 */
export const FLIGHT_FIXTURES: readonly FlightFixtureDefinition[] = [
  {
    // Mid-flight transatlantic red-eye — great for Golden Hour demo.
    flightNumber: "BA117",
    airline: AIRLINES.BA,
    origin: AIRPORTS.LHR,
    destination: AIRPORTS.JFK,
    departureOffsetMinutes: -3 * 60,
    scheduledDurationMinutes: 8 * 60 + 15,
    delayMinutes: 0,
    gate: "A15",
    aircraft: {
      registration: "G-STBA",
      type: AIRCRAFT_TYPES.B77W,
      operatorIataCode: "BA",
      manufactureDate: new Date("2010-03-12T00:00:00Z"),
    },
  },
  {
    // Boarding soon, delayed — demonstrates delay + gate-change UI.
    flightNumber: "EK241",
    airline: AIRLINES.EK,
    origin: AIRPORTS.DXB,
    destination: AIRPORTS.JFK,
    departureOffsetMinutes: 45,
    scheduledDurationMinutes: 14 * 60 + 30,
    delayMinutes: 25,
    gate: "B22",
    aircraft: {
      registration: "A6-EQA",
      type: AIRCRAFT_TYPES.A388,
      operatorIataCode: "EK",
      manufactureDate: new Date("2014-08-20T00:00:00Z"),
    },
  },
  {
    // Far out, gate not yet assigned — demonstrates the "not yet known" empty state.
    flightNumber: "SQ321",
    airline: AIRLINES.SQ,
    origin: AIRPORTS.SIN,
    destination: AIRPORTS.LHR,
    departureOffsetMinutes: 6 * 60,
    scheduledDurationMinutes: 13 * 60 + 40,
    delayMinutes: 0,
    gate: null,
    aircraft: {
      registration: "9V-SHA",
      type: AIRCRAFT_TYPES.A359,
      operatorIataCode: "SQ",
      manufactureDate: new Date("2016-11-02T00:00:00Z"),
    },
  },
  {
    // Ultra-long-haul, still well into its cruise.
    flightNumber: "QF9",
    airline: AIRLINES.QF,
    origin: AIRPORTS.PER,
    destination: AIRPORTS.LHR,
    departureOffsetMinutes: -11 * 60,
    scheduledDurationMinutes: 17 * 60,
    delayMinutes: 0,
    gate: "12",
    aircraft: {
      registration: "VH-ZND",
      type: AIRCRAFT_TYPES.B789,
      operatorIataCode: "QF",
      manufactureDate: new Date("2018-01-15T00:00:00Z"),
    },
  },
  {
    // Descending toward the destination — close to landing.
    flightNumber: "DL202",
    airline: AIRLINES.DL,
    origin: AIRPORTS.JFK,
    destination: AIRPORTS.LAX,
    departureOffsetMinutes: -5 * 60 - 50,
    scheduledDurationMinutes: 6 * 60,
    delayMinutes: 0,
    gate: "T4-22",
    aircraft: {
      registration: "N412DX",
      type: AIRCRAFT_TYPES.A20N,
      operatorIataCode: "DL",
      manufactureDate: new Date("2021-06-01T00:00:00Z"),
    },
  },
  {
    // Just landed, taxiing to the gate — demonstrates the landing Runway Moment.
    flightNumber: "LH441",
    airline: AIRLINES.LH,
    origin: AIRPORTS.FRA,
    destination: AIRPORTS.JFK,
    departureOffsetMinutes: -9 * 60 - 10,
    scheduledDurationMinutes: 9 * 60,
    delayMinutes: 0,
    gate: "B44",
    aircraft: {
      registration: "D-AIML",
      type: AIRCRAFT_TYPES.A359,
      operatorIataCode: "LH",
      manufactureDate: new Date("2017-04-18T00:00:00Z"),
    },
  },
  {
    // Fully arrived — ready to be saved to Flight Legacy.
    flightNumber: "UA23",
    airline: AIRLINES.UA,
    origin: AIRPORTS.SFO,
    destination: AIRPORTS.NRT,
    departureOffsetMinutes: -12 * 60,
    scheduledDurationMinutes: 10 * 60 + 30,
    delayMinutes: 0,
    gate: "G102",
    aircraft: {
      registration: "N26906",
      type: AIRCRAFT_TYPES.B789,
      operatorIataCode: "UA",
      manufactureDate: new Date("2013-09-09T00:00:00Z"),
    },
  },
];
