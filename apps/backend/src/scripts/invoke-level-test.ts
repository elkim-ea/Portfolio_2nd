import "dotenv/config";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import * as levelTest from "../handlers/levelTest.js";

const event: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "POST /level-test",
  rawPath: "/level-test",
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
      method: "POST",
      path: "/level-test",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "local-test",
    },
    requestId: "local-request",
    routeKey: "POST /level-test",
    stage: "$default",
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  },
  body: JSON.stringify({
    text: "안녕하세요. 저는 한국어를 공부하고 있어요. 한국 음식을 좋아해요.",
    learningGoal: "daily",
    explanationLanguage: "both",
  }),
  isBase64Encoded: false,
};

async function main() {
  const result = await levelTest.handler(event);

    console.log("Level Test Result:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});