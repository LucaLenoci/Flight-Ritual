-- CreateTable
CREATE TABLE "UserAirportCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "airportIataCode" TEXT NOT NULL,
    "firstCollectedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAirportCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAirportCard_airportIataCode_fkey" FOREIGN KEY ("airportIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAircraftCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aircraftTypeCode" TEXT NOT NULL,
    "firstCollectedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAircraftCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAircraftCard_aircraftTypeCode_fkey" FOREIGN KEY ("aircraftTypeCode") REFERENCES "AircraftType" ("icaoTypeCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAirlineCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "airlineIataCode" TEXT NOT NULL,
    "firstCollectedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAirlineCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAirlineCard_airlineIataCode_fkey" FOREIGN KEY ("airlineIataCode") REFERENCES "Airline" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserAirportCard_userId_idx" ON "UserAirportCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAirportCard_userId_airportIataCode_key" ON "UserAirportCard"("userId", "airportIataCode");

-- CreateIndex
CREATE INDEX "UserAircraftCard_userId_idx" ON "UserAircraftCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAircraftCard_userId_aircraftTypeCode_key" ON "UserAircraftCard"("userId", "aircraftTypeCode");

-- CreateIndex
CREATE INDEX "UserAirlineCard_userId_idx" ON "UserAirlineCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAirlineCard_userId_airlineIataCode_key" ON "UserAirlineCard"("userId", "airlineIataCode");
