import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { runLevelTest } from "../services/levelTestService.js";
import { validateLevelTestInput } from "../validators/levelTestValidator.js";

function response(
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
    body: JSON.stringify(body),
  };
}

function parseBody(body: string | undefined): unknown {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body");
  }
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

    if (method !== "POST") {
      return response(405, {
        message: "Method not allowed",
      });
    }

    const body = parseBody(event.body);
    const input = validateLevelTestInput(body);
    const result = await runLevelTest(input);

    return response(200, {
      message: "Level test completed",
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return response(400, {
      message,
    });
  }
};