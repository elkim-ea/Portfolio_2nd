import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "../src/handlers/usage.js";

const event: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "GET /usage",
  rawPath: "/usage",
  rawQueryString: "",
  headers: {
    "content-type": "application/json",
  },
  requestContext: {
    accountId: "local",
    apiId: "local",
    domainName: "localhost",
    domainPrefix: "localhost",
    http: {
      method: "GET",
      path: "/usage",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "local-test",
    },
    requestId: "local-request",
    routeKey: "GET /usage",
    stage: "$default",
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  },
  isBase64Encoded: false,
};

async function main() {
  const result = await handler(event);

  console.log("Status Code:", result.statusCode);
  console.log("Body:", result.body);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});