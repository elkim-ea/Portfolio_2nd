import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { runLevelTest } from "../services/levelTestService.js";
import { badRequest, ok, serverError, tooManyRequests } from "../utils/http.js";
import { UsageLimitExceededError } from "../types/usageLimit.js";

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    if (!body.text || typeof body.text !== "string") {
      return badRequest("text is required");
    }

    const result = await runLevelTest({
      text: body.text,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof UsageLimitExceededError) {
      return tooManyRequests("You have used all of today’s level test attempts.");
    }

    console.error(error);
    return serverError("Failed to run level test");
  }
};