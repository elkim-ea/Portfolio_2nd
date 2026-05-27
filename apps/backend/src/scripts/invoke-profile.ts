import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "../handlers/profile.js";

function createEvent(
  method: "GET" | "PUT",
  body?: Record<string, unknown>
): APIGatewayProxyEventV2 {
  const event: APIGatewayProxyEventV2 = {
    version: "2.0",
    routeKey: `${method} /profile`,
    rawPath: "/profile",
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
        method,
        path: "/profile",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "local-test",
      },
      requestId: "local-request",
      routeKey: `${method} /profile`,
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    isBase64Encoded: false,
  };

  if (body) {
    event.body = JSON.stringify(body);
  }

  return event;
}

async function main() {
  console.log("=== GET /profile ===");

  const getResult = await handler(createEvent("GET"));
  console.log("Status Code:", getResult.statusCode);
  console.log("Body:", getResult.body);

  console.log("\n=== PUT /profile ===");

  const putResult = await handler(
    createEvent("PUT", {
      currentLevel: "beginner",
      levelLabel: "Beginner A2",
      explanationLanguage: "both",
      conversationTone: "polite",
      learningGoal: "daily",
    })
  );

  console.log("Status Code:", putResult.statusCode);
  console.log("Body:", putResult.body);

  console.log("\n=== GET /profile after update ===");

  const getAfterUpdateResult = await handler(createEvent("GET"));
  console.log("Status Code:", getAfterUpdateResult.statusCode);
  console.log("Body:", getAfterUpdateResult.body);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});