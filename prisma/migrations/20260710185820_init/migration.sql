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
CREATE TABLE "Aircraft" (
    "registration" TEXT NOT NULL PRIMARY KEY,
    "aircraftTypeCode" TEXT NOT NULL,
    "operatorIataCode" TEXT,
    "manufactureDate" DATETIME,
    CONSTRAINT "Aircraft_aircraftTypeCode_fkey" FOREIGN KEY ("aircraftTypeCode") REFERENCES "AircraftType" ("icaoTypeCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Flight" (
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
    CONSTRAINT "Flight_airlineIataCode_fkey" FOREIGN KEY ("airlineIataCode") REFERENCES "Airline" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_originIataCode_fkey" FOREIGN KEY ("originIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_destinationIataCode_fkey" FOREIGN KEY ("destinationIataCode") REFERENCES "Airport" ("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AircraftAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flightId" TEXT NOT NULL,
    "aircraftRegistration" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "assignedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AircraftAssignment_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AircraftAssignment_aircraftRegistration_fkey" FOREIGN KEY ("aircraftRegistration") REFERENCES "Aircraft" ("registration") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JourneyEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flightId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sequenceKey" TEXT NOT NULL,
    "occurredAtUtc" DATETIME NOT NULL,
    "payload" TEXT NOT NULL,
    CONSTRAINT "JourneyEvent_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlightMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "savedAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "FlightMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FlightMemory_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Airport_icaoCode_key" ON "Airport"("icaoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_icaoCode_key" ON "Airline"("icaoCode");

-- CreateIndex
CREATE INDEX "Flight_phase_idx" ON "Flight"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_flightNumber_scheduledDepartureUtc_key" ON "Flight"("flightNumber", "scheduledDepartureUtc");

-- CreateIndex
CREATE UNIQUE INDEX "AircraftAssignment_flightId_key" ON "AircraftAssignment"("flightId");

-- CreateIndex
CREATE INDEX "JourneyEvent_flightId_idx" ON "JourneyEvent"("flightId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyEvent_flightId_type_sequenceKey_key" ON "JourneyEvent"("flightId", "type", "sequenceKey");

-- CreateIndex
CREATE UNIQUE INDEX "FlightMemory_flightId_key" ON "FlightMemory"("flightId");

-- CreateIndex
CREATE INDEX "FlightMemory_userId_idx" ON "FlightMemory"("userId");
