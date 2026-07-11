/** Base class for all domain-level failures (invalid values, illegal state transitions). */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidValueError extends DomainError {
  constructor(valueName: string, received: unknown, reason: string) {
    super(`Invalid ${valueName}: ${reason} (received: ${JSON.stringify(received)})`);
  }
}

export class IllegalStateTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super(`Illegal ${entity} transition from "${from}" to "${to}"`);
  }
}
