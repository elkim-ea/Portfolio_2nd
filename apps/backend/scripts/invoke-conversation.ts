import "dotenv/config";
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { handler } from "../src/handlers/conversation.js";

const event = {
  body: JSON.stringify({
    topic: "ordering food at a restaurant",
  }),
};

const result = (await handler(
  event as any,
  {} as any,
  {} as any,
)) as APIGatewayProxyStructuredResultV2;

console.log("Status Code:", result.statusCode);
console.log("Body:", result.body);