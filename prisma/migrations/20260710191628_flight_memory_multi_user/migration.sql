/*
  Warnings:

  - Added the required column `updatedAt` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshotJson` to the `FlightMemory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flightNumber" TEXT NOT NULL,
    "airlineIataCode" TEXT NOT NULL,
    "originIataCode" TEXT NOT NULL,
    "destinationIataCode" TEXT NOT NULL,
    "scheduledDepartureUtc" DATETIME NOT NULL,
    "scheduledArrivalUtc" DATETIME NOT NULL,
    "actualDepartureUtc" DATETIME,
    "actualArrivalUtc" DATETIME,
    "gate" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "phase" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flight_airlineIataCode_fkey" FOREIGN KEY ("airlineIataCode") REFERENCES "Airline" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_originIataCode_fkey" FOREIGN KEY ("originIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_destinationIataCode_fkey" FOREIGN KEY ("destinationIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Flight" ("actualArrivalUtc", "actualDepartureUtc", "airlineIataCode", "createdAt", "delayMinutes", "destinationIataCode", "flightNumber", "gate", "id", "originIataCode", "phase", "scheduledArrivalUtc", "scheduledDepartureUtc") SELECT "actualArrivalUtc", "actualDepartureUtc", "airlineIataCode", "createdAt", "delayMinutes", "destinationIataCode", "flightNumber", "gate", "id", "originIataCode", "phase", "scheduledArrivalUtc", "scheduledDepartureUtc" FROM "Flight";
DROP TABLE "Flight";
ALTER TABLE "new_Flight" RENAME TO "Flight";
CREATE INDEX "Flight_phase_idx" ON "Flight"("phase");
CREATE UNIQUE INDEX "Flight_flightNumber_scheduledDepartureUtc_key" ON "Flight"("flightNumber", "scheduledDepartureUtc");
CREATE TABLE "new_FlightMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "savedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "FlightMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FlightMemory_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FlightMemory" ("flightId", "id", "note", "savedAtUtc", "userId") SELECT "flightId", "id", "note", "savedAtUtc", "userId" FROM "FlightMemory";
DROP TABLE "FlightMemory";
ALTER TABLE "new_FlightMemory" RENAME TO "FlightMemory";
CREATE INDEX "FlightMemory_userId_idx" ON "FlightMemory"("userId");
CREATE UNIQUE INDEX "FlightMemory_userId_flightId_key" ON "FlightMemory"("userId", "flightId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
