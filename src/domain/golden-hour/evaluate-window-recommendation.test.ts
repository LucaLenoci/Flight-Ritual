import { describe, expect, it } from "vitest";
import { evaluateWindowRecommendation } from "./evaluate-window-recommendation";
import { RecommendationConfidence, WindowSide } from "./window-recommendation";

const observedAtUtc = new Date("2026-07-10T18:00:00Z");

describe("evaluateWindowRecommendation", () => {
  it("recommends NOT_APPLICABLE when the sun is high overhead (well outside golden hour)", () => {
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 180,
      sunElevationDeg: 45,
      aircraftHeadingDeg: 90,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.NOT_APPLICABLE);
  });

  it("recommends NOT_APPLICABLE when the sun is far below the horizon (night)", () => {
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 180,
      sunElevationDeg: -30,
      aircraftHeadingDeg: 90,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.NOT_APPLICABLE);
  });

  it("recommends the right side when the golden-hour sun sits off the right of the heading", () => {
    // Heading due north (0deg); sun at 90deg (due east) is off the right side.
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 90,
      sunElevationDeg: 2,
      aircraftHeadingDeg: 0,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.RIGHT);
  });

  it("recommends the left side when the golden-hour sun sits off the left of the heading", () => {
    // Heading due north (0deg); sun at 270deg (due west) is off the left side.
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 270,
      sunElevationDeg: 2,
      aircraftHeadingDeg: 0,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.LEFT);
  });

  it("recommends EITHER when the sun is nearly dead ahead", () => {
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 5,
      sunElevationDeg: 2,
      aircraftHeadingDeg: 0,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.EITHER);
  });

  it("recommends EITHER when the sun is nearly dead astern", () => {
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 185,
      sunElevationDeg: 2,
      aircraftHeadingDeg: 0,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.EITHER);
  });

  it("gives HIGH confidence near the middle of the golden-hour band and MEDIUM near its edges", () => {
    const middle = evaluateWindowRecommendation({
      sunAzimuthDeg: 90,
      sunElevationDeg: 1,
      aircraftHeadingDeg: 0,
      observedAtUtc,
    });
    const edge = evaluateWindowRecommendation({
      sunAzimuthDeg: 90,
      sunElevationDeg: 5.5,
      aircraftHeadingDeg: 0,
      observedAtUtc,
    });
    expect(middle.confidence).toBe(RecommendationConfidence.HIGH);
    expect(edge.confidence).toBe(RecommendationConfidence.MEDIUM);
  });

  it("wraps heading/azimuth correctly across the 0/360 boundary", () => {
    // Heading 350deg, sun at 30deg is 40deg clockwise of the nose -> right side.
    const result = evaluateWindowRecommendation({
      sunAzimuthDeg: 30,
      sunElevationDeg: 2,
      aircraftHeadingDeg: 350,
      observedAtUtc,
    });
    expect(result.side).toBe(WindowSide.RIGHT);
  });
});
