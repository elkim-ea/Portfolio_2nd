import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ZodError } from "zod";
import { generateConversation } from "../services/conversationService.js";
import {
  conversationRequestSchema,
  type ConversationRequestBody,
} from "../validators/conversationValidator.js";
import { badRequest, ok, serverError, tooManyRequests } from "../utils/http.js";
import { InvalidJsonBodyError, parseJsonBody } from "../utils/request.js";
import { formatZodError } from "../utils/validation.js";
import { UsageLimitExceededError } from "../types/usageLimit.js";
import { getAuthenticatedUserId } from "../utils/auth.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const rawBody = parseJsonBody<ConversationRequestBody>(event);
    const body = conversationRequestSchema.parse(rawBody);

    const userId = getAuthenticatedUserId(event);

    const result = await generateConversation({
      userId,
      ...(body.topic ? { topic: body.topic } : {}),
      ...(body.level ? { level: body.level } : {}),
      ...(body.tone ? { tone: body.tone } : {}),
    });

    return ok(result);
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return badRequest(error.message);
    }

    if (error instanceof ZodError) {
      return badRequest(formatZodError(error));
    }

    if (error instanceof UsageLimitExceededError) {
      return tooManyRequests(
        "You have used all of today’s conversation practice attempts.",
      );
    }

    console.error("Conversation handler error:", error);

    return serverError("Failed to generate conversation");
  }
};