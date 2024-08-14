export const httpWrapper = async (fn, {
  event,
  fnContext = 'httpWrapper',
} = {}) => {
  if (!fn) {
    throw new Error('No handker is provided');
  }

  if (!event) {
    throw new Error('No event is provided');
  }

  try {
    const { body, queryStringParameters = {}, pathParameters = {} } = event;
    const jsonBody = parseEventBodySafe(body, fnContext);

    const response = await fn({
      queryStringParameters,
      pathParameters,
      jsonBody,
      event,
    });

    return response;
  } catch (error) {
    console.error(`[${fnContext.toUpperCase()}]:`, error);

    return createErrorResponse({
      code: error?.statusCode || 400,
      error: error?.message || 'Internal server error',
    });
  }
}

export const createSucessResponse = ({
  code = 200,
  body = {},
} = {}) => {
  return {
    statusCode: code,
    body: JSON.stringify(body),
  };
}

export const createErrorResponse = ({ code = 400, error = 'Internal server error' } = {}) => {
  return {
    statusCode: code,
    body: JSON.stringify({ error }),
  };
};

const parseEventBodySafe = (json, fnContext) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(`[${fnContext.toUpperCase()}] Error: parsing event.body`, error);

    return {};
  }
}