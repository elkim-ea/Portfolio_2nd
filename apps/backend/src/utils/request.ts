import type { APIGatewayProxyEventV2 } from "aws-lambda";

export class InvalidJsonBodyError extends Error {
  constructor(message = "Request body must be valid JSON") {
    super(message);
    this.name = "InvalidJsonBodyError";
  }
}

export const parseJsonBody = <T extends Record<string, unknown>>(
  event: APIGatewayProxyEventV2,
): T => {
  if (!event.body) {
    return {} as T;
  }

  try {
    return JSON.parse(event.body) as T;
  } catch {
    throw new InvalidJsonBodyError();
  }
};