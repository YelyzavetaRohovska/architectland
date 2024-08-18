import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validateBuildingLimitsWithinPlateaus,
  splitBuildingLimitsByElevation,
} from "../../utils/calculateBuildingLimits";
import ApiError from "../../utils/apiError";
import * as turf from "@turf/turf";
import { FeatureCollection, Feature, Polygon, Position, Point } from "geojson";

vi.mock("@turf/turf", () => ({
  kinks: vi.fn(),
  intersect: vi.fn(),
  booleanClockwise: vi.fn(),
  union: vi.fn(),
  booleanWithin: vi.fn(),
  featureCollection: vi.fn(),
}));

const mockPolygon: Feature<Polygon> = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
  },
  properties: {},
};

const mockPointFeatureCollection: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
      properties: {
        name: "Location 1",
        description: "This is a mock point",
      },
    },
  ],
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("validateBuildingLimitsWithinPlateaus", () => {
  it("should throw an error if building limit has self-intersections", () => {
    vi.spyOn(turf, "kinks").mockReturnValueOnce(mockPointFeatureCollection);
    vi.spyOn(turf, "kinks").mockReturnValueOnce(mockPointFeatureCollection);

    expect(() =>
      validateBuildingLimitsWithinPlateaus(
        { type: "FeatureCollection", features: [mockPolygon] },
        { type: "FeatureCollection", features: [mockPolygon] }
      )
    ).toThrowError(new ApiError(422, "Building Limit has self-intersections"));
  });

  it("should throw an error if height plateaus have a clockwise direction", () => {
    vi.spyOn(turf, "kinks").mockReturnValueOnce({
      type: "FeatureCollection",
      features: [],
    });

  vi.spyOn(turf, "kinks").mockReturnValueOnce({
    type: "FeatureCollection",
    features: [],
  });

    vi.spyOn(turf, "booleanClockwise").mockReturnValue(true);

    expect(() =>
      validateBuildingLimitsWithinPlateaus(
        { type: "FeatureCollection", features: [mockPolygon] },
        { type: "FeatureCollection", features: [mockPolygon] }
      )
    ).toThrowError(
      new ApiError(
        422,
        "Building Limit has a clockwise direction in an exterior rings"
      )
    );
  });

  it("should return true if building limits and height plateaus are valid", () => {
    vi.spyOn(turf, "kinks").mockReturnValue({
      type: "FeatureCollection",
      features: [],
    });
    vi.spyOn(turf, "kinks").mockReturnValue({
      type: "FeatureCollection",
      features: [],
    });
    vi.spyOn(turf, "booleanClockwise").mockReturnValueOnce(false);
    vi.spyOn(turf, "union").mockReturnValueOnce(mockPolygon);
    vi.spyOn(turf, "booleanWithin").mockReturnValueOnce(true);
    vi.spyOn(turf, "featureCollection").mockReturnValue({
      type: "FeatureCollection",
      features: [mockPolygon],
    });

    const result = validateBuildingLimitsWithinPlateaus(
      { type: "FeatureCollection", features: [mockPolygon] },
      { type: "FeatureCollection", features: [mockPolygon] }
    );

    expect(result).toBe(true);
  });
});

describe("splitBuildingLimitsByElevation", () => {
  it("should split building limits by elevation", () => {
    vi.spyOn(turf, "intersect").mockReturnValueOnce(mockPolygon);

    const result = splitBuildingLimitsByElevation(mockPolygon, [
      { ...mockPolygon, properties: { elevation: 10 } },
    ]);

    expect(result).toHaveLength(1);
    expect(turf.intersect).toHaveBeenCalled();
  });

  it("should return an empty array if no intersections are found", () => {
    vi.spyOn(turf, "intersect").mockReturnValueOnce(null);

    const result = splitBuildingLimitsByElevation(mockPolygon, [
      { ...mockPolygon, properties: { elevation: 10 } },
    ]);

    expect(result).toHaveLength(0);
  });
});
