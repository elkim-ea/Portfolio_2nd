import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ZodError } from "zod";
import { generateConversation } from "../services/conversationService.js";
import {
  conversationRequestSchema,
  type ConversationRequestBody,
} from "../validators/conversationValidator.js";
import { badRequest, ok, serverError, tooManyRequests } from "../utils/http.js";
import {
  InvalidJsonBodyError,
  parseJsonBody,
} from "../utils/request.js";
import { formatZodError } from "../utils/validation.js";
import { UsageLimitExceededError } from "../types/usageLimit.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const rawBody = parseJsonBody<ConversationRequestBody>(event);
    const body = conversationRequestSchema.parse(rawBody);

    const result = await generateConversation(body);

    return ok(result);

  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return badRequest(error.message);
    }

    if (error instanceof ZodError) {
      return badRequest(formatZodError(error));
    }

    if (error instanceof UsageLimitExceededError) {
      return tooManyRequests("You have used all of today’s conversation practice attempts.");
    }

    console.error("Conversation handler error:", error);
    return serverError("Failed to generate conversation");
  }
};