export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class FlightNotFoundError extends ApplicationError {
  constructor(flightNumber: string, scheduledDepartureUtc: Date) {
    super(`No flight found for ${flightNumber} on ${scheduledDepartureUtc.toISOString().slice(0, 10)}`);
  }
}

export class FlightNotFoundByIdError extends ApplicationError {
  constructor(flightId: string) {
    super(`No flight found with id ${flightId}`);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = "Not authorized to perform this action") {
    super(message);
  }
}

export class FlightNotEligibleForLegacyError extends ApplicationError {
  constructor(flightId: string) {
    super(`Flight ${flightId} has not arrived yet and cannot be saved to Flight Legacy`);
  }
}
