import * as dotenv from "dotenv";

import dbPostgresService from "../dbRepo/dbPostgresService";
import ApiError from "./apiError";

dotenv.config();

interface IOptions {
  event: any;
  fnContext?: string;
}

interface IHTTPResponse {
  statusCode: number;
}

interface IHTTPResponseSuccess extends IHTTPResponse {
  body: string;
}

interface IHTTPResponseError extends IHTTPResponse {
  error: string;
}

type ResponseType = IHTTPResponseSuccess | IHTTPResponseError;

export const httpWrapper = async (
  fn: (...args: any) => Promise<ResponseType>,
  { event, fnContext = "httpWrapper" }: IOptions
): Promise<ResponseType> => {
  if (!fn) {
    throw new Error("No handler is provided");
  }

  if (!event) {
    throw new Error("No event is provided");
  }

  const pgClient = new dbPostgresService({
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "password",
    database: process.env.DB_NAME ?? "postgres",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
  });

  try {
    await pgClient.connect();

    const { body, queryStringParameters = {}, pathParameters = {} } = event;
    const jsonBody = parseEventBodySafe(body, fnContext);

    const response = await fn({
      queryStringParameters,
      pathParameters,
      jsonBody,
      event,
      pgClient,
    });

    return response;
  } catch (error: any) {
    console.error(`[${fnContext.toUpperCase()}]:`, error);

    if (error instanceof ApiError) {
      return createErrorResponse(error.statusCode, error.message);
    }

    return createErrorResponse(
      error?.statusCode || 400,
      "Internal server error"
    );
  } finally {
    pgClient.end();
  }
};

export const createSucessResponse = (code: number = 200, body: any = {}) => {
  return {
    statusCode: code,
    body: JSON.stringify(body),
  };
};

export const createErrorResponse = (
  code: number = 400,
  error: string = "Internal server error"
) => {
  return {
    statusCode: code,
    body: JSON.stringify({ error }),
  };
};

const parseEventBodySafe = (json: any, fnContext: string) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(
      `[${fnContext.toUpperCase()}] Error: parsing event.body`,
      error
    );

    return {};
  }
};
