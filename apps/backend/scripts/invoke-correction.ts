import "dotenv/config";
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { handler } from "../src/handlers/correction.js";

const event = {
  body: JSON.stringify({
    text: "나는 어제 학교에 가요.",
  }),
};

const result = (await handler(
  event as any,
  {} as any,
  {} as any
)) as APIGatewayProxyStructuredResultV2;

console.log("Status Code:", result.statusCode);
console.log("Body:", result.body);