import {
  kinks,
  intersect,
  featureCollection,
  booleanClockwise,
  union,
  booleanWithin
} from "@turf/turf";

export const validatePolygon = (polygon, { itemType = "Polygon" } = {}) => {
  // Validate if the polygon has self-intersections
  if (getSelfIntersectionsPoints(polygon).length) {
    throw new Error(`${itemType} has self-intersections`);
  }

  // Validate if the polygon has a clockwise direction in the exterior ring
  if (isClockWiseDirection(polygon.geometry.coordinates[0])) {
    throw new Error(`${itemType} has a clockwise direction in an exterior rings`);
  }

  // Validate if the polygon has a counter-clockwise direction in the internal rings
  if (polygon.geometry.coordinates.length > 1) {
    for (let i = 1; i < polygon.geometry.coordinates.length; i++) {
      if (!isClockWiseDirection(polygon.geometry.coordinates[i])) {
        throw new Error(`${itemType} has a counter-clockwise direction in an internal ring`);
      }
    }
  }

  return true;
}

export const isBuildingLimitWithingPlateaus = (buildingLimit, plateaus) => {
  const unio = union(featureCollection(plateaus));

  const within = booleanWithin(buildingLimit, unio);
  if (!within) {
    throw new Error("Building Limits is not within the Height Plateaus");
  }
}

export const splitBuildingLimitsByElevation = (buildingLimit, plateausWithElevation) => {
  const splitedBuildingLimits = [];

  for (let i = 0; i < plateausWithElevation.length; i++) {
    let { properties: { elevation } } = plateausWithElevation[i];

    let intersection = intersect(
      featureCollection([buildingLimit, plateausWithElevation[i]]), {
      properties: { elevation }
    });

    if (!intersection) {
      continue;
    }

    splitedBuildingLimits.push(intersection);
  }

  return splitedBuildingLimits;
};

const isClockWiseDirection = (coords) => {
  return booleanClockwise(coords);
};

const getSelfIntersectionsPoints = (polygon) => {
  return kinks(polygon).features.map((f) => f.geometry.coordinates);
};