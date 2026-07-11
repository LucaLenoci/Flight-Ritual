-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Airport" (
    "iataCode" TEXT NOT NULL PRIMARY KEY,
    "icaoCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timeZone" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Airline" (
    "iataCode" TEXT NOT NULL PRIMARY KEY,
    "icaoCode" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AircraftType" (
    "icaoTypeCode" TEXT NOT NULL PRIMARY KEY,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "facts" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LoggedFlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "flightDateUtc" DATETIME NOT NULL,
    "airlineIataCode" TEXT NOT NULL,
    "airlineSource" TEXT NOT NULL DEFAULT 'USER_PROVIDED',
    "originIataCode" TEXT NOT NULL,
    "originSource" TEXT NOT NULL DEFAULT 'USER_PROVIDED',
    "destinationIataCode" TEXT NOT NULL,
    "destinationSource" TEXT NOT NULL DEFAULT 'USER_PROVIDED',
    "aircraftTypeCode" TEXT,
    "aircraftTypeSource" TEXT NOT NULL DEFAULT 'USER_PROVIDED',
    "tailNumber" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LoggedFlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoggedFlight_airlineIataCode_fkey" FOREIGN KEY ("airlineIataCode") REFERENCES "Airline" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoggedFlight_originIataCode_fkey" FOREIGN KEY ("originIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoggedFlight_destinationIataCode_fkey" FOREIGN KEY ("destinationIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoggedFlight_aircraftTypeCode_fkey" FOREIGN KEY ("aircraftTypeCode") REFERENCES "AircraftType" ("icaoTypeCode") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAirportCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "airportIataCode" TEXT NOT NULL,
    "firstCollectedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceLoggedFlightId" TEXT,
    CONSTRAINT "UserAirportCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAirportCard_airportIataCode_fkey" FOREIGN KEY ("airportIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAirportCard_sourceLoggedFlightId_fkey" FOREIGN KEY ("sourceLoggedFlightId") REFERENCES "LoggedFlight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAircraftCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aircraftTypeCode" TEXT NOT NULL,
    "firstCollectedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceLoggedFlightId" TEXT,
    CONSTRAINT "UserAircraftCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAircraftCard_aircraftTypeCode_fkey" FOREIGN KEY ("aircraftTypeCode") REFERENCES "AircraftType" ("icaoTypeCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAircraftCard_sourceLoggedFlightId_fkey" FOREIGN KEY ("sourceLoggedFlightId") REFERENCES "LoggedFlight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAirlineCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "airlineIataCode" TEXT NOT NULL,
    "firstCollectedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceLoggedFlightId" TEXT,
    CONSTRAINT "UserAirlineCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAirlineCard_airlineIataCode_fkey" FOREIGN KEY ("airlineIataCode") REFERENCES "Airline" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAirlineCard_sourceLoggedFlightId_fkey" FOREIGN KEY ("sourceLoggedFlightId") REFERENCES "LoggedFlight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Airport_icaoCode_key" ON "Airport"("icaoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_icaoCode_key" ON "Airline"("icaoCode");

-- CreateIndex
CREATE INDEX "LoggedFlight_userId_idx" ON "LoggedFlight"("userId");

-- CreateIndex
CREATE INDEX "LoggedFlight_userId_flightDateUtc_idx" ON "LoggedFlight"("userId", "flightDateUtc");

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
