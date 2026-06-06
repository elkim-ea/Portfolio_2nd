import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { getUsageSummary } from "../services/usageLimitService.js";

function response(
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const method = event.requestContext.http.method;

    if (method === "OPTIONS") {
      return response(200, {
        message: "ok",
      });
    }

    if (method !== "GET") {
      return response(405, {
        message: "Method not allowed",
      });
    }

    const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return response(401, {
        message: "Unauthorized",
      });
    }

    const usage = await getUsageSummary(userId);

    return response(200, {
      message: "Usage fetched",
      usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return response(400, {
      message,
    });
  }
};