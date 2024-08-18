import ApiError from "../../utils/apiError";
import {
  createErrorResponse,
  createSucessResponse,
  httpWrapper,
} from "../../utils/httpHelper";
import {
  validateBuildingLimitsWithinPlateaus,
  splitBuildingLimitsByElevation,
} from "../../utils/calculateBuildingLimits";

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

      // Insert the Building Limits and Height Plateaus into the database
      const resp = await pgClient.insertItem("buildingLimits", {
        buildingLimit: building_limits,
        heightPlateaus: height_plateaus,
        splitedBuildingLimits,
      }, { returning: true });

      if (!resp?.rows?.length) {
        throw new ApiError(500, "Failed to insert building limits");
      }

      return createSucessResponse(200, resp.rows[0]);
    },
    {
      fnContext: "post_building_limits",
      event,
    }
  );

export const get = async (event: any) =>
  httpWrapper(
    async ({ pgClient, queryStringParameters }) => {
      const rows = await pgClient.fetchItems("buildingLimits", {
        limit: queryStringParameters.limit,
      });

      if (!rows) {
        throw new ApiError(404, "Failed to fetch building limits");
      }

      return createSucessResponse(200, rows);
    },
    {
      fnContext: "get_building_limits",
      event,
    }
  );
