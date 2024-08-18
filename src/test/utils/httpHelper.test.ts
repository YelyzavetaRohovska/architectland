import { describe, it, expect, vi } from "vitest";
import {
  httpWrapper,
  createSucessResponse,
} from "../../utils/httpHelper";
import ApiError from "../../utils/apiError";
import dbPostgres from "../../dbRepo/dbPostgresService";
import { afterEach } from "node:test";


vi.mock("../../dbRepo/dbPostgresService", () => {
  const dbPostgres = vi.fn();

  dbPostgres.prototype.connect = vi.fn();
  dbPostgres.prototype.end = vi.fn();

  return { default: dbPostgres };
});

const mockHandler = async (params: any) => {
  if (params.event.error) {
    throw new ApiError(400, "Bad Request");
  }
  return createSucessResponse(200, { message: "Success" });
};

describe("httpWrapper", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return a success response when the handler executes successfully", async () => {
    const event = {
      body: JSON.stringify({ test: "data" }),
      queryStringParameters: {},
      pathParameters: {},
    };

    const response = await httpWrapper(mockHandler, { event });

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }),
    });
  });

  it("should return an error response when the handler throws an ApiError", async () => {
    vi.spyOn(dbPostgres.prototype, "connect").mockRejectedValueOnce(new ApiError(500, "Failed to connect to PostgreSQL"));

    const event = {
      body: JSON.stringify({}),
      queryStringParameters: {},
      pathParameters: {},
    };

    const response = await httpWrapper(mockHandler, { event });

    expect(response).toEqual({
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to connect to PostgreSQL" }),
    });
  });

  it("should handle generic errors and return a 400 Internal server error response", async () => {
    const faultyHandler = async () => {
      throw new Error("Some unknown error");
    };

    const event = {
      body: JSON.stringify({}),
      queryStringParameters: {},
      pathParameters: {},
    };

    const response = await httpWrapper(faultyHandler, { event });

    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: "Internal server error" }),
    });
  });
});
