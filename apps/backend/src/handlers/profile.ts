import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import {
  getOrCreateUserProfile,
  updateUserProfile,
} from "../services/profileService.js";
import { validateUpdateUserProfileInput } from "../validators/profileValidator.js";

function response(
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,PUT,OPTIONS",
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

function getUserId(event: APIGatewayProxyEventV2): string {
  const requestContext = event.requestContext as unknown as {
    authorizer?: {
      jwt?: {
        claims?: {
          sub?: string;
        };
      };
    };
  };

  const sub = requestContext.authorizer?.jwt?.claims?.sub;

  if (typeof sub === "string" && sub.length > 0) {
    return sub;
  }

  return "dev-user-001";
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const method = event.requestContext.http.method;

    if (method === "OPTIONS") {
      return response(200, {
        message: "ok",
      });
    }

    const userId = getUserId(event);

    if (method === "GET") {
      const profile = await getOrCreateUserProfile(userId);

      return response(200, {
        message: "User profile fetched",
        profile,
      });
    }

    if (method === "PUT") {
      const body = parseBody(event.body);
      const input = validateUpdateUserProfileInput(body);
      const profile = await updateUserProfile(userId, input);

      return response(200, {
        message: "User profile updated",
        profile,
      });
    }

    return response(405, {
      message: "Method not allowed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return response(400, {
      message,
    });
  }
}