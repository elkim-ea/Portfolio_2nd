import type { APIGatewayProxyEventV2 } from "aws-lambda";

export function getAuthenticatedUserId(event: APIGatewayProxyEventV2): string {
  const sub = (event.requestContext as any).authorizer?.jwt?.claims?.sub;

  if (typeof sub !== "string" || sub.length === 0) {
    throw new Error("UNAUTHORIZED");
  }

  return sub;
}