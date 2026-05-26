import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ok } from "../utils/http.js";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return ok({
    status: "ok",
    service: "koreanmate-backend",
  });
};