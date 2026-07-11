import { describe, expect, it } from "vitest";
import { nextCountryMilestone } from "./country-milestones";

describe("nextCountryMilestone", () => {
  it("returns the first milestone above the current count, with the gap remaining", () => {
    const result = nextCountryMilestone(7);
    expect(result?.milestone.name).toBe("Globetrotter");
    expect(result?.milestone.countryThreshold).toBe(10);
    expect(result?.countriesRemaining).toBe(3);
  });

  it("returns the very first milestone when the user has no countries yet", () => {
    const result = nextCountryMilestone(0);
    expect(result?.milestone.name).toBe("Wanderer");
    expect(result?.countriesRemaining).toBe(3);
  });

  it("returns null once every milestone has been reached", () => {
    expect(nextCountryMilestone(100)).toBeNull();
  });

  it("treats a count exactly at a threshold as reached, not remaining", () => {
    const result = nextCountryMilestone(10);
    expect(result?.milestone.name).toBe("Jetsetter");
  });
});
