# Flight Ritual

A premium flight companion for aviation enthusiasts: live journey tracking, Aircraft Reveal, Golden Hour window recommendations, Runway Moments, a personal Flight Legacy, and a collectible-card system ("Aloft") for every airport, aircraft model, and airline you fly.

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind CSS, Framer Motion, Prisma + SQLite, Vitest, `@phosphor-icons/react`.

## Architecture

Layered, with a strict one-way dependency rule: `domain` → nothing, `application` → `domain`, `infrastructure` → `application` ports, `presentation` (`app/`, `components/`) → `application` via the composition root or API routes.

```
src/
  domain/            Pure business logic: entities, value objects, state machines. No I/O, no framework, no third-party deps.
                      Includes domain/cards/ (Collectible Cards bounded context: rarity, card catalog, ownership entities) —
                      deliberately separate from the flight-tracking entities it wraps (Airport/AircraftType/Airline).
  application/        Use cases (Journey Engine, Aircraft Enrichment, Golden Hour Engine, Legacy Service, Card unlock/album)
                       and the ports (interfaces) infrastructure must implement: FlightDataProvider, AircraftDataProvider,
                       FlightRepository, LegacyRepository, CardRepository, CardCatalogProvider, Clock.
  infrastructure/      Port implementations: Prisma repositories, fixture-backed mock providers, dev-mode session auth,
                       and composition-root.ts (the one place concrete infrastructure is wired to application ports).
  app/, components/    Next.js routes and UI. Route handlers are thin: validate input, call a use case, map errors.
  styles/tokens/       Aloft design tokens (colors, typography, spacing, effects) — the single source of truth
                       Tailwind's config wraps.
```

### Key decisions

- **No live flight data provider is wired in.** `MockFlightDataProvider` / `MockAircraftDataProvider` implement the same ports a real adapter (AeroDataBox, OpenSky, ...) would, with realistic fixture flights whose timelines are anchored to server-start time and evolve with real wall-clock time. Swapping in a real provider only touches `infrastructure/providers/`.
- **Idempotent event ingestion.** `JourneyEvent` identity is `(flightId, type, sequenceKey)`; repeatable event types (gate/delay changes) derive their key from the new value, so re-polling an unchanged snapshot never creates duplicates, and a provider poll that skips several phases has its intermediate events synthesized (`synthesizeForwardEventTypes`) rather than lost.
- **Collectible Cards dedup is DB-enforced, not just application-checked.** `UserAirportCard` / `UserAircraftCard` / `UserAirlineCard` each carry a `@@unique([userId, entityId])` constraint; `PrismaCardRepository` unlocks a card via a plain `create()` and treats a unique-constraint violation as "already owned" — there's no read-then-write race window. Aircraft Cards are keyed by `AircraftType` (the model, e.g. "A320neo"), never by `Aircraft`/registration (the specific tail number) — see `domain/cards/aircraft-card.ts`.
- **SQLite via Prisma.** Chosen for zero external setup in this environment; the Prisma layer is the only place that would need to change to move to Postgres.
- **Dev-mode single-user auth.** `infrastructure/auth/dev-session.ts` mints an HMAC-signed session cookie identifying a per-browser dev user — no real identity provider yet. Every application service takes an explicit `userId`, always derived server-side from the session, never from client input, so swapping in real auth (NextAuth, etc.) later doesn't touch business logic.
- **Golden Hour math** uses `suncalc` (kept behind an adapter in `application/golden-hour-engine/`) so the domain layer — which encodes the actual "what counts as a good window" business rule — stays dependency-free and easily testable with hand-computed inputs.
- **Icons are bundled at build time (`@phosphor-icons/react`), not loaded from a CDN.** The design brief specified Phosphor via `unpkg.com`, but CDN icon fonts are fragile in practice (ad-blockers, corporate/sandboxed networks, offline) — confirmed unreachable in this dev sandbox. The brief explicitly invites swapping the delivery mechanism; this keeps the icon set but removes the runtime dependency on a third-party CDN being reachable.
- **Design tokens are this implementation's interpretation.** The Aloft design system was specified in prose (palette philosophy, type pairing, motion rules) with no literal CSS/token file attached. Concrete hex values, the numeric type/spacing scale, and common/uncommon rarity hues (rare=violet and legendary=gold were explicit; common/uncommon were not) are authored in `src/styles/tokens/`, documented inline as interpretation, and would need reconciling against a real token file if one becomes available. Per the design brief's own content rules, no "X% of flyers own this card" style stat is shown anywhere — this app has no real user base to back that number honestly.

## Running locally

```bash
npm install             # also runs `prisma generate` via postinstall
cp .env.example .env    # then set a real DEV_SESSION_SECRET (32+ random bytes)
npx prisma migrate deploy
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

Tests focus on the areas most likely to hide real bugs: journey state-machine transitions and idempotency, Golden Hour recommendation logic, Aircraft Reveal's provider-fallback chain, Legacy stats accumulation, and Collectible Cards dedup — all as pure/fake-backed unit tests except one: `infrastructure/persistence/prisma-card-repository.test.ts` runs against the real SQLite database to verify the unique-constraint-based dedup actually holds under concurrent unlock attempts, which an in-memory fake can't meaningfully demonstrate. That file creates and cleans up its own scoped rows and needs the schema migrated first.
