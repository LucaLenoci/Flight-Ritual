# Flight Ritual

A premium flight companion for aviation enthusiasts: live journey tracking, Aircraft Reveal, Golden Hour window recommendations, Runway Moments, and a personal Flight Legacy.

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind CSS, Framer Motion, Prisma + SQLite, Vitest.

## Architecture

Layered, with a strict one-way dependency rule: `domain` → nothing, `application` → `domain`, `infrastructure` → `application` ports, `presentation` (`app/`, `components/`) → `application` via the composition root or API routes.

```
src/
  domain/            Pure business logic: entities, value objects, state machines. No I/O, no framework, no third-party deps.
  application/        Use cases (Journey Engine, Aircraft Enrichment, Golden Hour Engine, Legacy Service) and the ports
                       (interfaces) infrastructure must implement: FlightDataProvider, AircraftDataProvider,
                       FlightRepository, LegacyRepository, Clock.
  infrastructure/      Port implementations: Prisma repositories, fixture-backed mock providers, dev-mode session auth,
                       and composition-root.ts (the one place concrete infrastructure is wired to application ports).
  app/, components/    Next.js routes and UI. Route handlers are thin: validate input, call a use case, map errors.
```

### Key decisions

- **No live flight data provider is wired in.** `MockFlightDataProvider` / `MockAircraftDataProvider` implement the same ports a real adapter (AeroDataBox, OpenSky, ...) would, with realistic fixture flights whose timelines are anchored to server-start time and evolve with real wall-clock time. Swapping in a real provider only touches `infrastructure/providers/`.
- **Idempotent event ingestion.** `JourneyEvent` identity is `(flightId, type, sequenceKey)`; repeatable event types (gate/delay changes) derive their key from the new value, so re-polling an unchanged snapshot never creates duplicates, and a provider poll that skips several phases has its intermediate events synthesized (`synthesizeForwardEventTypes`) rather than lost.
- **SQLite via Prisma.** Chosen for zero external setup in this environment; the Prisma layer is the only place that would need to change to move to Postgres.
- **Dev-mode single-user auth.** `infrastructure/auth/dev-session.ts` mints an HMAC-signed session cookie identifying a per-browser dev user — no real identity provider yet. Every application service takes an explicit `userId`, always derived server-side from the session, never from client input, so swapping in real auth (NextAuth, etc.) later doesn't touch business logic.
- **Golden Hour math** uses `suncalc` (the one non-trivial third-party dependency) for solar position, kept behind an adapter (`application/golden-hour-engine/sun-position-calculator.ts`) so the domain layer — which encodes the actual "what counts as a good window" business rule — stays dependency-free and easily testable with hand-computed inputs.

## Running locally

```bash
npm install
cp .env.example .env   # then set a real DEV_SESSION_SECRET (32+ random bytes)
npx prisma migrate deploy
npm run dev
```

## Testing

```bash
npm test          # Vitest: domain + application layer unit tests
npm run typecheck
npm run lint
```

Tests focus on the areas most likely to hide real bugs: journey state-machine transitions and idempotency, Golden Hour recommendation logic, Aircraft Reveal's provider-fallback chain, and Legacy stats accumulation — all as pure/fake-backed unit tests, no database required.
