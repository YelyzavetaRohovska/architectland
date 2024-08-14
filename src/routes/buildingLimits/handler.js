import { createSucessResponse, httpWrapper } from "../../utils/httpHelper.js";
import {
  validateBuildingLimitsWithinPlateaus,
  splitBuildingLimitsByElevation,
} from "../../utils/calculateBuildingLimits.js";

export const post = (event) =>
  httpWrapper(
    async ({ jsonBody }) => {
      const { building_limits, height_plateaus } = jsonBody;

      // Early return if the Building Limits polygon has validation errors
      validateBuildingLimitsWithinPlateaus(building_limits, height_plateaus);

      // Split the Building Limits by the Height Plateaus
      const splitedBuildingLimits = splitBuildingLimitsByElevation(
        building_limits.features[0],
        height_plateaus.features
      );

      return createSucessResponse({
        statusCode: 200,
        body: {
          buildingLimits: building_limits,
          heightPlateaus: height_plateaus,
          splitedBuildingLimits
        },
      });
    },
    {
      fnContext: "post_building_limits",
      event,
    }
  );
