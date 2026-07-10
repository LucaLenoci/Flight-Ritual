import { describe, expect, it } from "vitest";
import { InvalidValueError } from "./errors";
import { FlightNumber } from "./flight-number";

describe("FlightNumber", () => {
  it("parses a compact form like 'BA284'", () => {
    const fn = FlightNumber.create("BA284");
    expect(fn.toString()).toBe("BA284");
  });

  it("parses a spaced form like 'AF 447' and normalizes it", () => {
    const fn = FlightNumber.create("af 447");
    expect(fn.toString()).toBe("AF447");
  });

  it("rejects garbage input", () => {
    expect(() => FlightNumber.create("not-a-flight")).toThrow(InvalidValueError);
  });

  it("treats equal flight numbers as equal regardless of source formatting", () => {
    expect(FlightNumber.create("BA 284").equals(FlightNumber.create("BA284"))).toBe(true);
  });
});
