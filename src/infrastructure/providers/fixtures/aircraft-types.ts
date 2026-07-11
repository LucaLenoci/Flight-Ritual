export interface AircraftTypeSeed {
  icaoTypeCode: string;
  manufacturer: string;
  model: string;
  facts: string[];
  /** Typical cruise speed in km/h — published manufacturer figures, flavor data for Card Detail. */
  cruiseSpeedKmh: number;
}

/**
 * Curated overrides for a handful of common aircraft types (model/type,
 * never a tail number): real cruise speeds and fun facts. The full
 * AircraftType catalog is bulk-seeded from OpenFlights' planes.dat (see
 * infrastructure/seed/seed-reference-data.ts), which has no facts or speed
 * data of its own — these entries are layered on top by ICAO code and take
 * priority over the bulk-derived defaults. Expand this list as needed.
 */
export const AIRCRAFT_TYPES: AircraftTypeSeed[] = [
  {
    icaoTypeCode: "B77W",
    manufacturer: "Boeing",
    model: "777-300ER",
    cruiseSpeedKmh: 905,
    facts: [
      "The 777-300ER's wingtips flex upward by as much as 3.5 meters in flight.",
      "It was the world's largest twinjet until the 777X entered service.",
      "Its GE90 engines are wide enough to fit a Boeing 737 fuselage through the fan.",
    ],
  },
  {
    icaoTypeCode: "A359",
    manufacturer: "Airbus",
    model: "A350-900",
    cruiseSpeedKmh: 903,
    facts: [
      "Over 70% of the A350's airframe is made from advanced materials, including carbon-fibre composite.",
      "Its distinctive curved wingtips reduce drag and improve fuel efficiency.",
    ],
  },
  {
    icaoTypeCode: "B789",
    manufacturer: "Boeing",
    model: "787-9 Dreamliner",
    cruiseSpeedKmh: 903,
    facts: [
      "Cabin altitude is pressurized to a lower equivalent of 6,000 feet, easing jet lag.",
      "Its windows are the largest of any commercial airliner and dim electronically instead of using shades.",
    ],
  },
  {
    icaoTypeCode: "A388",
    manufacturer: "Airbus",
    model: "A380-800",
    cruiseSpeedKmh: 903,
    facts: [
      "The A380 is the world's largest passenger airliner, with a wingspan of nearly 80 meters.",
      "A full A380 can carry more than 800 passengers in an all-economy configuration.",
    ],
  },
  {
    icaoTypeCode: "A20N",
    manufacturer: "Airbus",
    model: "A320neo",
    cruiseSpeedKmh: 828,
    facts: [
      "The 'neo' stands for 'New Engine Option', cutting fuel burn by roughly 15% over the A320ceo.",
      "Sharklet wingtip devices reduce drag and add range without lengthening the wing.",
    ],
  },
  {
    icaoTypeCode: "A21N",
    manufacturer: "Airbus",
    model: "A321neo",
    cruiseSpeedKmh: 828,
    facts: [
      "The A321neo is the longest-fuselage member of the A320 family, seating up to 244 passengers.",
      "Its extended range variants can fly routes once reserved for widebody aircraft.",
    ],
  },
  {
    icaoTypeCode: "B738",
    manufacturer: "Boeing",
    model: "737-800",
    cruiseSpeedKmh: 828,
    facts: [
      "The 737-800 is one of the most-produced commercial jetliners in aviation history.",
      "It shares over 90% parts commonality with earlier 737 Next Generation variants.",
    ],
  },
  {
    icaoTypeCode: "B39M",
    manufacturer: "Boeing",
    model: "737 MAX 9",
    cruiseSpeedKmh: 839,
    facts: [
      "The MAX series uses CFM LEAP-1B engines with larger fan blades than previous 737s.",
      "Split-tip winglets on the MAX reduce fuel burn by roughly 1.5% versus blended winglets.",
    ],
  },
  {
    icaoTypeCode: "E190",
    manufacturer: "Embraer",
    model: "E190",
    cruiseSpeedKmh: 829,
    facts: [
      "The E190's 2-2 seating layout means no middle seats on a mainline-style regional jet.",
      "It was designed with a fuselage cross-section wide enough for overhead bins to fit standard roll-aboard bags.",
    ],
  },
];
