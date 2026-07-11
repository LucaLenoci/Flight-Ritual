export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class FlightNotFoundByIdError extends ApplicationError {
  constructor(flightId: string) {
    super(`No logged flight found with id ${flightId}`);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = "Not authorized to perform this action") {
    super(message);
  }
}

/** Raised when a client submits a reference code (airport/airline/aircraft type) that doesn't exist in the seeded catalog — validation at the domain boundary, never trusting client-supplied codes. */
export class UnknownReferenceEntityError extends ApplicationError {
  constructor(entityKind: "airport" | "airline" | "aircraft type", code: string) {
    super(`Unknown ${entityKind}: "${code}"`);
  }
}
