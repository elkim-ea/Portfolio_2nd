export type JsonResponseBody = Record<string, unknown> | unknown[];

export const jsonResponse = (
  statusCode: number,
  body: JsonResponseBody,
) => {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
};

export const ok = (body: JsonResponseBody) => {
  return jsonResponse(200, body);
};

export const badRequest = (message: string) => {
  return jsonResponse(400, {
    error: "Bad Request",
    message,
  });
};

export const internalServerError = () => {
  return jsonResponse(500, {
    error: "Internal Server Error",
    message: "Unexpected server error",
  });
};