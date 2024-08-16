import {
  kinks,
  intersect,
  featureCollection,
  booleanClockwise,
  union,
  booleanWithin
} from "@turf/turf";

import {
  FeatureCollection,
  Feature,
  Polygon,
  Position
} from "geojson";

import ApiError from "./apiError";

export const validateBuildingLimitsWithinPlateaus = (
  buildingLimitCollection: FeatureCollection<Polygon>,
  heightPlateausCollection: FeatureCollection<Polygon>
) => {
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
  buildingLimit: Feature<Polygon>,
  plateausWithElevation: Feature<Polygon, { elevation: number }>[]
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

const validatePolygon = (polygon: Feature<Polygon>, { itemType = "Polygon" } = {}) => {
  // Validate if the polygon has self-intersections
  if (getSelfIntersectionsPoints(polygon).length) {
    throw new ApiError(422, `${itemType} has self-intersections`);
  }

  // Validate if the polygon has a clockwise direction in the exterior ring
  if (isClockWiseDirection(polygon.geometry.coordinates[0])) {
    throw new ApiError(422, `${itemType} has a clockwise direction in an exterior rings`);
  }

  // Validate if the polygon has a counter-clockwise direction in the internal rings
  if (polygon.geometry.coordinates.length > 1) {
    for (let i = 1; i < polygon.geometry.coordinates.length; i++) {
      if (!isClockWiseDirection(polygon.geometry.coordinates[i])) {
        throw new ApiError(422, `${itemType} has a counter-clockwise direction in an internal ring`);
      }
    }
  }

  return true;
}

const isClockWiseDirection = (coords: Position[]) => {
  return booleanClockwise(coords);
};

const getSelfIntersectionsPoints = (polygon: Feature<Polygon>) => {
  return kinks(polygon).features.map((f) => f.geometry.coordinates);
};

const isBuildingLimitWithingPlateaus = (buildingLimit: Feature<Polygon>, plateaus: Feature<Polygon>[]) => {
  const plateausUnionGeo = union(featureCollection(plateaus));

  if (!plateausUnionGeo) {
    throw new ApiError(422, "Height Plateaus are not contiguous");
  }

  if (!booleanWithin(buildingLimit, plateausUnionGeo)) {
    // Validate if the Building Limits is within the Height Plateaus
    throw new ApiError(422, 'Building Limits is not within the Height Plateaus');
  }
};