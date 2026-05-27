import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ZodError } from "zod";
import { correctKoreanText } from "../services/correctionService.js";
import {
  correctionRequestSchema,
  type CorrectionRequestBody,
} from "../validators/correctionValidator.js";
import { badRequest, ok, serverError } from "../utils/http.js";

import {
  InvalidJsonBodyError,
  parseJsonBody,
} from "../utils/request.js";
import { formatZodError } from "../utils/validation.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const rawBody = parseJsonBody<CorrectionRequestBody>(event);
    const body = correctionRequestSchema.parse(rawBody);

    const result = await correctKoreanText(body);

    return ok(result);

  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return badRequest(error.message);
    }

    if (error instanceof ZodError) {
      return badRequest(formatZodError(error));
    }
    console.error("Correction handler error:", error);
    
    return serverError("Failed to generate conversation");
  }
  
};