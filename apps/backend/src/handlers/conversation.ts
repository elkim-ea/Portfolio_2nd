import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ZodError } from "zod";
import { generateConversation } from "../services/conversationService.js";
import {
  conversationRequestSchema,
  type ConversationRequestBody,
} from "../validators/conversationValidator.js";
import { badRequest, internalServerError, ok } from "../utils/http.js";
import {
  InvalidJsonBodyError,
  parseJsonBody,
} from "../utils/request.js";
import { formatZodError } from "../utils/validation.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const rawBody = parseJsonBody<ConversationRequestBody>(event);
    const body = conversationRequestSchema.parse(rawBody);

    const result = await generateConversation(body);

    return ok({
      message: "Conversation API is working",
      ...result,
    });
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return badRequest(error.message);
    }

    if (error instanceof ZodError) {
      return badRequest(formatZodError(error));
    }

    return internalServerError();
  }
};