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

  it("splits a 2-letter designator from the number correctly, not greedily consuming a leading digit", () => {
    const fn = FlightNumber.create("BA284");
    expect(fn.airlineDesignator).toBe("BA");
    expect(fn.number).toBe("284");
  });

  it("still recovers a 3-character designator when the 2-character split isn't followed by a digit", () => {
    const fn = FlightNumber.create("ITA100");
    expect(fn.airlineDesignator).toBe("ITA");
    expect(fn.number).toBe("100");
  });
});
