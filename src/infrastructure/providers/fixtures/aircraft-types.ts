import { ProviderAircraftType } from "../../../application/ports/aircraft-data-provider";

export const AIRCRAFT_TYPES = {
  B77W: {
    icaoTypeCode: "B77W",
    manufacturer: "Boeing",
    model: "777-300ER",
    facts: [
      "The 777-300ER's wingtips flex upward by as much as 3.5 meters in flight.",
      "It was the world's largest twinjet until the 777X entered service.",
      "Its GE90 engines are wide enough to fit a Boeing 737 fuselage through the fan.",
    ],
  },
  A359: {
    icaoTypeCode: "A359",
    manufacturer: "Airbus",
    model: "A350-900",
    facts: [
      "Over 70% of the A350's airframe is made from advanced materials, including carbon-fibre composite.",
      "Its distinctive curved wingtips reduce drag and improve fuel efficiency.",
    ],
  },
  B789: {
    icaoTypeCode: "B789",
    manufacturer: "Boeing",
    model: "787-9 Dreamliner",
    facts: [
      "Cabin altitude is pressurized to a lower equivalent of 6,000 feet, easing jet lag.",
      "Its windows are the largest of any commercial airliner and dim electronically instead of using shades.",
    ],
  },
  A388: {
    icaoTypeCode: "A388",
    manufacturer: "Airbus",
    model: "A380-800",
    facts: [
      "The A380 is the world's largest passenger airliner, with a wingspan of nearly 80 meters.",
      "A full A380 can carry more than 800 passengers in an all-economy configuration.",
    ],
  },
  A20N: {
    icaoTypeCode: "A20N",
    manufacturer: "Airbus",
    model: "A320neo",
    facts: [
      "The 'neo' stands for 'New Engine Option', cutting fuel burn by roughly 15% over the A320ceo.",
      "Sharklet wingtip devices reduce drag and add range without lengthening the wing.",
    ],
  },
} satisfies Record<string, ProviderAircraftType>;
