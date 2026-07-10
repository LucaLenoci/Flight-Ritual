/** Abstracts "now" so application logic stays deterministic and testable. */
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
