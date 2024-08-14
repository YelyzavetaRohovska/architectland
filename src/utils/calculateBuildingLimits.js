import {
  kinks,
  intersect,
  featureCollection,
  booleanClockwise,
  union,
  booleanWithin
} from "@turf/turf";

export const validateBuildingLimitsWithinPlateaus = (buildingLimitCollection, heightPlateausCollection) => {
  // Early return if the Building Limits polygon has errors
  validatePolygon(buildingLimitCollection.features[0], {
    itemType: "Building Limit",
  });

  // Early return if Height Plateaus has errors
  heightPlateausCollection.features.forEach((polygon) => {
    validatePolygon(polygon, { itemType: "Height Plateau" });
  });

  // Validate if the Building Limits is within the Height Plateaus
  isBuildingLimitWithingPlateaus(buildingLimitCollection.features[0], heightPlateausCollection.features);

  return true;
};

export const splitBuildingLimitsByElevation = (
  buildingLimit,
  plateausWithElevation
) => {
  const splitedBuildingLimits = [];

  for (let i = 0; i < plateausWithElevation.length; i++) {
    let {
      properties: { elevation },
    } = plateausWithElevation[i];

    let intersection = intersect(
      featureCollection([buildingLimit, plateausWithElevation[i]]),
      {
        properties: { elevation },
      }
    );

    if (!intersection) {
      continue;
    }

    splitedBuildingLimits.push(intersection);
  }

  return splitedBuildingLimits;
};

const validatePolygon = (polygon, { itemType = "Polygon" } = {}) => {
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

const isClockWiseDirection = (coords) => {
  return booleanClockwise(coords);
};

const getSelfIntersectionsPoints = (polygon) => {
  return kinks(polygon).features.map((f) => f.geometry.coordinates);
};

const isBuildingLimitWithingPlateaus = (buildingLimit, plateaus) => {
  const plateausUnionGeo = union(featureCollection(plateaus));

  // Validate if the Building Limits is within the Height Plateaus
  if (!booleanWithin(buildingLimit, plateausUnionGeo)) {
    throw new Error("Building Limits is not within the Height Plateaus");
  }
};