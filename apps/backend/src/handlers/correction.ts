import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ZodError } from "zod";
import { correctKoreanText } from "../services/correctionService.js";
import {
  correctionRequestSchema,
  type CorrectionRequestBody,
} from "../validators/correctionValidator.js";
import { badRequest, ok, serverError, tooManyRequests } from "../utils/http.js";
import { InvalidJsonBodyError, parseJsonBody } from "../utils/request.js";
import { formatZodError } from "../utils/validation.js";
import { UsageLimitExceededError } from "../types/usageLimit.js";
import { getAuthenticatedUserId } from "../utils/auth.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const rawBody = parseJsonBody<CorrectionRequestBody>(event);
    const body = correctionRequestSchema.parse(rawBody);

    const userId = getAuthenticatedUserId(event);

    const result = await correctKoreanText({
      userId,
      text: body.text,
      ...(body.level ? { level: body.level } : {}),
      ...(body.explanationLanguage
        ? { explanationLanguage: body.explanationLanguage }
        : {}),
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
        "You have used all of today’s writing correction attempts.",
      );
    }

    console.error("Correction handler error:", error);

    return serverError("Failed to correct Korean text");
  }
};