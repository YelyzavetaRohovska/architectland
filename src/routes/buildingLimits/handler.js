import {
  validatePolygon,
  splitBuildingLimitsByElevation,
} from "../../utils/calculateBuildingLimits.js";

export const post = async (event) => {
  const { building_limits, height_plateaus } = JSON.parse(event.body);

  // Early return if the Building Limits polygon has errors
  validatePolygon(building_limits.features[0], { itemType: "Building Limits" });

  // Early return if Height Plateaus has errors
  height_plateaus.features.forEach(polygon => {
    validatePolygon(polygon, { itemType: "Height Plateau" });
  });

  // Split the Building Limits by the Height Plateaus
  const splitedBuildingLimits = splitBuildingLimitsByElevation(building_limits.features[0], height_plateaus.features);

  return {
    statusCode: 200,
    body: JSON.stringify({
      splitedBuildingLimits
    }),
  };
};
