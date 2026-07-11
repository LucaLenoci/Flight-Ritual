# Aloft

A personal flight-life collection app. Log flights you've actually taken —
just a flight number and a date — and Aloft turns your travel history into a
collectible album: an Airport, Aircraft, and Airline card unlocks the first
time each unique one appears in your log, plus lifetime stats and route
insights. No live tracking, no real-time flight state — this is a logbook,
not a departures board.

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind CSS, Framer Motion, Prisma + SQLite, Vitest, `@phosphor-icons/react`.

## Architecture

Layered, with a strict one-way dependency rule: `domain` → nothing, `application` → `domain`, `infrastructure` → `application` ports, `presentation` (`app/`, `components/`) → `application` via the composition root or API routes.

```
src/
  domain/
    flight-log/        LoggedFlight (the aggregate root), Route, FieldProvenance.
    statistics/         Pure aggregation over a user's logged flights (StatsSnapshot, UserCollection).
    cards/               Collectible Cards bounded context: rarity, card catalog, ownership entities —
                          deliberately separate from Airport/AircraftType/Airline, the entities it wraps.
    airport/, aircraft/  Reference entities: Airport, Airline, AircraftType (model/type, not tail number).
    shared/              Value objects with no I/O: FlightNumber, IATA/ICAO codes, Coordinates, domain errors.
  application/
    flight-log/          Save/list a user's logged flights.
    flight-enrichment/    Resolves what can be resolved for free (airline, from the flight-number prefix);
                          flags what needs manual entry (route, aircraft type — see below).
    cards/                Card unlock evaluation + album assembly.
    statistics/           Derives a StatsSnapshot from a user's flights.
    ports/                Interfaces infrastructure must implement — the core domain is never coupled to
                          one external data provider.
  infrastructure/
    persistence/          Prisma repositories.
    providers/             Reference-data lookups (backed by the seeded catalog, not live network calls)
                          and NullFlightRouteLookupProvider (see below).
    seed/                  seed-reference-data.ts — bulk-imports the open-data reference catalog.
    composition-root.ts    The one place concrete infrastructure is wired to application ports.
  app/, components/       Next.js routes and UI. Route handlers are thin: validate input, call a use case, map errors.
  styles/tokens/           Aloft design tokens (colors, typography, spacing, effects).
```

## The collectible-card rule

A card unlocks the *first* time its entity appears anywhere in a user's flight log — never on a repeat. Aircraft
cards are keyed by **model/type** (e.g. "A320neo"), never by tail number/registration. Example: Bari → Milan
Malpensa on ITA Airways in an A320neo, logged for the first time, unlocks 4 cards (2 airports + 1 aircraft + 1
airline). Logging the same route on the same airline again in an A321 you've never flown unlocks exactly 1 card
(the A321). See `application/cards/unlock-cards-for-flight.ts` and its test for the worked example.

Deduplication is enforced at the database level (`@@unique([userId, entityId])` on each `UserXCard` table in
`prisma/schema.prisma`), not just in application code — `PrismaCardRepository` unlocks a card via a plain
`create()` and treats a unique-constraint violation as "already owned," so there's no read-then-write race window
under concurrent unlock attempts.

## Open-data strategy

No paid APIs. The full reference catalog — airports, airlines, and aircraft types — is bulk-seeded from free, open
datasets, not a curated subset:

- **Airports** (~7,700) — [OurAirports](https://github.com/davidmegginson/ourairports-data), every entry with a
  valid IATA and ICAO code.
- **Airlines** (~930) — [OpenFlights](https://github.com/jpatokal/openflights) `airlines.dat`, every carrier
  (active or historical) with a valid IATA and ICAO code.
- **Aircraft types** (~230) — OpenFlights `planes.dat`, every type with a valid ICAO type code. This dataset has
  no facts or cruise-speed figures, so a small curated list
  (`infrastructure/providers/fixtures/aircraft-types.ts`) layers real facts/speeds on top of the common types by
  ICAO code; every other type still gets a real manufacturer/model name, just without the flavor text.

Seeding is idempotent (every row is an upsert) and tolerant of upstream data-quality conflicts — a handful of rows
across ~8,800 total can share a secondary code (e.g. two historical airlines with the same ICAO designator); those
are skipped and logged rather than aborting the run.

Run the seed once before using the app for real data (not run automatically at install time, since it makes
network calls to third-party hosts):

```bash
npm run db:seed:reference
```

**Known limitation, by design, not a bug:** no free, keyless, reliable open-data source exists for "flight number +
arbitrary past date → route + aircraft type" (OpenSky's historical endpoints need a registration/ICAO24, not a
flight-number+date key, and are tightly rate-limited for anonymous access). Airline is resolved automatically from
the flight-number prefix; route and aircraft type are manual entry, constrained to the seeded reference catalog
(never free text) rather than a live lookup. `FlightRouteLookupProvider` is a real port with a documented stub
implementation (`NullFlightRouteLookupProvider`) — wiring in a real historical-flight provider later is a new
adapter, not a domain change.

## Running locally

```bash
npm install             # also runs `prisma generate` via postinstall
cp .env.example .env    # then set a real DEV_SESSION_SECRET (32+ random bytes)
npx prisma migrate deploy
npm run db:seed:reference   # optional but recommended — real airport/airline data instead of an empty catalog
npm run dev
```

If you ever see `@prisma/client did not initialize yet`, run `npx prisma generate` and restart the dev server — some npm configurations (e.g. `--ignore-scripts`) skip the `postinstall` hook.

## Testing

```bash
npx prisma migrate deploy   # required once — one test suite runs against the real DB
npm test
npm run typecheck
npm run lint
```

Tests focus on the collectible-card business rule (first-unlock-only dedup, model-not-registration for aircraft,
race-safe DB uniqueness), stats aggregation, and value-object validation — mostly pure/fake-backed unit tests
except `infrastructure/persistence/prisma-card-repository.test.ts`, which runs against the real SQLite database to
verify the unique-constraint-based dedup actually holds under concurrent unlock attempts (something an in-memory
fake can't meaningfully demonstrate). That file creates and cleans up its own scoped rows and needs the schema
migrated first.
