import { 
  createErrorResponse,
  createSucessResponse,
  httpWrapper } from '../../utils/httpHelper';
import {
  validateBuildingLimitsWithinPlateaus,
  splitBuildingLimitsByElevation,
} from '../../utils/calculateBuildingLimits';

export const post = async (event: any) =>
  httpWrapper(
    async ({ jsonBody, pgClient }) => {
      const { building_limits, height_plateaus } = jsonBody;

      // Early return if the Building Limits polygon has validation errors
      validateBuildingLimitsWithinPlateaus(building_limits, height_plateaus);

      // Split the Building Limits by the Height Plateaus
      const splitedBuildingLimits = splitBuildingLimitsByElevation(
        building_limits.features[0],
        height_plateaus.features
      );

      if (!splitedBuildingLimits.length) {
        return createErrorResponse(400, "No intersection found");
      }

      return createSucessResponse(200,
       {
          buildingLimits: building_limits,
          heightPlateaus: height_plateaus,
          splitedBuildingLimits,
        },
      );
    },
    {
      fnContext: "post_building_limits",
      event,
    }
  );
