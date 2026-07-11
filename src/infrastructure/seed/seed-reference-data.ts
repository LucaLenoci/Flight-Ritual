/**
 * One-time (re-runnable) bulk seed of the full Airport/Airline/AircraftType
 * reference catalog from free, open datasets:
 *  - Airports: OurAirports (github.com/davidmegginson/ourairports-data) —
 *    every entry with a valid IATA and ICAO code, regardless of size or
 *    current service status (this is the full catalog, not a
 *    commercial-service-only subset).
 *  - Airlines: OpenFlights (github.com/jpatokal/openflights) — every
 *    carrier with a valid IATA and ICAO code, active or historical.
 *  - Aircraft types: OpenFlights' planes.dat — every type with a valid
 *    ICAO type code. Manufacturer/model are derived from its plain-text
 *    name (a light heuristic, cosmetic only). This dataset has no facts or
 *    cruise-speed figures, so the curated, hand-written entries in
 *    infrastructure/providers/fixtures/aircraft-types.ts are layered on
 *    top by ICAO code and take priority — the bulk rows only fill in
 *    everything the curated list doesn't cover.
 *
 * Idempotent: every row is an upsert keyed by its natural code, so
 * re-running this script (e.g. to pick up dataset updates) is safe.
 *
 * Not run automatically at install/build time — it makes real network
 * calls to third-party hosts, which install-time scripts should avoid.
 * Run explicitly: `npm run db:seed:reference`.
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { AIRCRAFT_TYPES, AircraftTypeSeed } from "../providers/fixtures/aircraft-types";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

/**
 * Runs a single upsert, swallowing a unique-constraint conflict rather than
 * aborting the whole seed run. Cross-run collisions are expected here: this
 * table's natural key (e.g. iataCode) can differ between two rows that
 * share a secondary unique field (e.g. icaoCode) when the upstream dataset
 * reassigns codes over time or a broader filter (e.g. including inactive
 * airlines) surfaces a row a previous run's narrower filter never inserted.
 * A handful of such data-quality conflicts shouldn't sacrifice the
 * thousands of good rows in the same run.
 */
async function upsertSkippingConflicts(upsert: () => Promise<unknown>): Promise<boolean> {
  try {
    await upsert();
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      return false;
    }
    throw error;
  }
}

const OURAIRPORTS_URL = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";
const OPENFLIGHTS_AIRLINES_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";
const OPENFLIGHTS_PLANES_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat";
const FETCH_TIMEOUT_MS = 30_000;

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/** Minimal RFC4180-style CSV line splitter: handles quoted fields containing commas and escaped ("") quotes. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

interface AirportSeedRow {
  iataCode: string;
  icaoCode: string;
  name: string;
  city: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
}

function parseAirports(csvText: string): AirportSeedRow[] {
  const rows = parseCsv(csvText);
  const header = rows[0]!;
  const col = (name: string) => header.indexOf(name);

  const idxIata = col("iata_code");
  const idxIcao = col("icao_code");
  const idxName = col("name");
  const idxMunicipality = col("municipality");
  const idxCountry = col("iso_country");
  const idxContinent = col("continent");
  const idxLat = col("latitude_deg");
  const idxLon = col("longitude_deg");

  const seen = new Map<string, AirportSeedRow>();
  const seenIcaoCodes = new Set<string>();

  for (const row of rows.slice(1)) {
    const iataCode = row[idxIata]?.trim().toUpperCase();
    // Real IATA codes are strictly 2-3 letters; a small number of
    // OurAirports rows put a local/numeric identifier in this field when no
    // real IATA code exists. Reject those here rather than seeding data that
    // violates the domain's own IataCode value-object invariant.
    if (!iataCode || !/^[A-Z]{2,3}$/.test(iataCode)) continue;

    // Real ICAO airport codes are strictly 4 letters. OurAirports' fallback
    // "gps_code" column often holds a non-standard local identifier
    // (frequently alphanumeric) for airports without a real ICAO
    // assignment — accepting it here would seed a fake ICAO code, so only
    // the actual icao_code column counts, and it must be 4 letters.
    const icaoCode = (row[idxIcao]?.trim() || "").toUpperCase();
    if (!/^[A-Z]{4}$/.test(icaoCode)) continue;
    // icaoCode also carries its own unique constraint (schema.prisma); skip
    // later duplicates on either axis rather than crash the upsert.
    if (seenIcaoCodes.has(icaoCode)) continue;

    const latitude = Number(row[idxLat]);
    const longitude = Number(row[idxLon]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    // Some IATA codes appear more than once in the raw data (rare data-quality issue); first entry wins.
    if (seen.has(iataCode)) continue;

    seenIcaoCodes.add(icaoCode);
    seen.set(iataCode, {
      iataCode,
      icaoCode,
      name: row[idxName]?.trim() || iataCode,
      city: row[idxMunicipality]?.trim() || row[idxName]?.trim() || iataCode,
      country: row[idxCountry]?.trim() || "Unknown",
      continent: row[idxContinent]?.trim() || "",
      latitude,
      longitude,
    });
  }

  return Array.from(seen.values());
}

interface AirlineSeedRow {
  iataCode: string;
  icaoCode: string;
  name: string;
}

function parseAirlines(datText: string): AirlineSeedRow[] {
  const rows = parseCsv(datText);
  const seen = new Map<string, AirlineSeedRow>();
  const seenIcaoCodes = new Set<string>();

  // OpenFlights airlines.dat has no header row: Airline ID, Name, Alias, IATA, ICAO, Callsign, Country, Active
  for (const row of rows) {
    const [, name] = row;
    const iata = row[3];
    const icao = row[4];

    const iataCode = iata?.trim().toUpperCase();
    const icaoCode = icao?.trim().toUpperCase();
    if (!iataCode || !/^[A-Z0-9]{2,3}$/.test(iataCode)) continue;
    if (!icaoCode || !/^[A-Z]{3}$/.test(icaoCode)) continue;
    if (!name || name.trim() === "\\N") continue;

    // iataCode is our natural key, but icaoCode also carries its own unique
    // constraint (schema.prisma) — a handful of OpenFlights rows share an
    // ICAO code across distinct IATA-keyed entries (data-quality artifact);
    // skip later duplicates on either axis rather than crash.
    if (seen.has(iataCode) || seenIcaoCodes.has(icaoCode)) continue;
    seenIcaoCodes.add(icaoCode);
    seen.set(iataCode, { iataCode, icaoCode, name: name.trim() });
  }

  return Array.from(seen.values());
}

/** Splits a plane's plain-text name into a manufacturer/model guess, e.g. "Airbus A320neo" -> ("Airbus", "A320neo"). Cosmetic only. */
function splitManufacturerAndModel(name: string): { manufacturer: string; model: string } {
  const firstSpace = name.indexOf(" ");
  if (firstSpace === -1) return { manufacturer: name, model: name };
  return { manufacturer: name.slice(0, firstSpace), model: name.slice(firstSpace + 1) };
}

function parseAircraftTypes(datText: string): AircraftTypeSeed[] {
  const rows = parseCsv(datText);
  const seen = new Map<string, AircraftTypeSeed>();

  // OpenFlights planes.dat has no header row: Name, IATA code, ICAO code
  for (const row of rows) {
    const [name, , icao] = row;
    const icaoTypeCode = icao?.trim().toUpperCase();
    if (!icaoTypeCode || icaoTypeCode === "\\N" || !/^[A-Z0-9]{2,4}$/.test(icaoTypeCode)) continue;
    if (!name || name.trim() === "\\N") continue;
    if (seen.has(icaoTypeCode)) continue;

    const { manufacturer, model } = splitManufacturerAndModel(name.trim());
    seen.set(icaoTypeCode, { icaoTypeCode, manufacturer, model, facts: [], cruiseSpeedKmh: 0 });
  }

  // Curated entries (real facts, real cruise speeds) take priority over the bulk-derived defaults for the same code.
  for (const curated of AIRCRAFT_TYPES) {
    seen.set(curated.icaoTypeCode, curated);
  }

  return Array.from(seen.values());
}

async function seedAirports(db: PrismaClient): Promise<number> {
  console.log("Fetching OurAirports dataset...");
  const csvText = await fetchText(OURAIRPORTS_URL);
  const airports = parseAirports(csvText);
  console.log(`Parsed ${airports.length} airports. Upserting...`);

  let seeded = 0;
  for (const airport of airports) {
    const ok = await upsertSkippingConflicts(() =>
      db.airport.upsert({
        where: { iataCode: airport.iataCode },
        create: {
          iataCode: airport.iataCode,
          icaoCode: airport.icaoCode,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          continent: airport.continent || null,
          latitude: airport.latitude,
          longitude: airport.longitude,
          timeZone: "UTC", // OurAirports doesn't carry IANA time zones; refined later via manual correction if needed.
        },
        update: {
          icaoCode: airport.icaoCode,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          continent: airport.continent || null,
          latitude: airport.latitude,
          longitude: airport.longitude,
        },
      }),
    );
    if (ok) seeded++;
  }

  if (seeded < airports.length) console.log(`Skipped ${airports.length - seeded} airports with conflicting codes.`);
  return seeded;
}

async function seedAirlines(db: PrismaClient): Promise<number> {
  console.log("Fetching OpenFlights airlines dataset...");
  const datText = await fetchText(OPENFLIGHTS_AIRLINES_URL);
  const airlines = parseAirlines(datText);
  console.log(`Parsed ${airlines.length} airlines. Upserting...`);

  let seeded = 0;
  for (const airline of airlines) {
    const ok = await upsertSkippingConflicts(() =>
      db.airline.upsert({
        where: { iataCode: airline.iataCode },
        create: { iataCode: airline.iataCode, icaoCode: airline.icaoCode, name: airline.name },
        update: { icaoCode: airline.icaoCode, name: airline.name },
      }),
    );
    if (ok) seeded++;
  }

  if (seeded < airlines.length) console.log(`Skipped ${airlines.length - seeded} airlines with conflicting codes.`);
  return seeded;
}

async function seedAircraftTypes(db: PrismaClient): Promise<number> {
  console.log("Fetching OpenFlights aircraft types dataset...");
  const datText = await fetchText(OPENFLIGHTS_PLANES_URL);
  const aircraftTypes = parseAircraftTypes(datText);
  console.log(`Parsed ${aircraftTypes.length} aircraft types (${AIRCRAFT_TYPES.length} with curated details). Upserting...`);

  for (const type of aircraftTypes) {
    await db.aircraftType.upsert({
      where: { icaoTypeCode: type.icaoTypeCode },
      create: {
        icaoTypeCode: type.icaoTypeCode,
        manufacturer: type.manufacturer,
        model: type.model,
        facts: JSON.stringify(type.facts),
        cruiseSpeedKmh: type.cruiseSpeedKmh || null,
      },
      update: {
        manufacturer: type.manufacturer,
        model: type.model,
        facts: JSON.stringify(type.facts),
        cruiseSpeedKmh: type.cruiseSpeedKmh || null,
      },
    });
  }
  return aircraftTypes.length;
}

async function main() {
  const db = new PrismaClient();
  try {
    const aircraftTypeCount = await seedAircraftTypes(db);
    const airlineCount = await seedAirlines(db);
    const airportCount = await seedAirports(db);
    console.log(
      `Reference data seeded: ${airportCount} airports, ${airlineCount} airlines, ${aircraftTypeCount} aircraft types.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("Reference data seed failed:", error);
  process.exitCode = 1;
});
