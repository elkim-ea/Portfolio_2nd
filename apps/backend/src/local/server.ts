import "dotenv/config";
import http from "node:http";
import { handler as correctionHandler } from "../handlers/correction.js";
import { handler as conversationHandler } from "../handlers/conversation.js";
import { handler as levelTestHandler } from "../handlers/levelTest.js";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const PORT = Number(process.env.PORT ?? 3000);

type LambdaHandler = typeof correctionHandler;

const createApiGatewayEvent = async (
  req: http.IncomingMessage
): Promise<APIGatewayProxyEventV2> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf-8");

  return {
    version: "2.0",
    routeKey: `${req.method} ${req.url}`,
    rawPath: req.url?.split("?")[0] ?? "/",
    rawQueryString: req.url?.split("?")[1] ?? "",
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(",") : value ?? "",
      ])
    ),
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: req.method ?? "GET",
        path: req.url?.split("?")[0] ?? "/",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: req.headers["user-agent"] ?? "",
      },
      requestId: "local-request",
      routeKey: `${req.method} ${req.url}`,
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    isBase64Encoded: false,
    body: body ?? "",
  };
};

const sendJson = (
  res: http.ServerResponse,
  statusCode: number,
  body: unknown
) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });

  res.end(typeof body === "string" ? body : JSON.stringify(body));
};

const handleLambda = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  lambdaHandler: LambdaHandler
) => {
  const event = await createApiGatewayEvent(req);

  const result = await lambdaHandler(event, {} as never, {} as never);

  if (typeof result === "string") {
    sendJson(res, 200, result);
    return;
  }

  if (!result) {
    sendJson(res, 500, { message: "No response from handler" });
    return;
  }

  sendJson(res, result.statusCode ?? 200, result.body ?? "{}");
};

const server = http.createServer(async (req, res) => {
  try {
    const path = req.url?.split("?")[0];

    if (req.method === "OPTIONS") {
      sendJson(res, 204, "");
      return;
    }

    if (req.method === "GET" && path === "/health") {
      sendJson(res, 200, {
        status: "ok",
        message: "Local backend server is running",
      });
      return;
    }

    if (req.method === "POST" && path === "/correction") {
      await handleLambda(req, res, correctionHandler);
      return;
    }

    if (req.method === "POST" && path === "/conversation") {
      await handleLambda(req, res, conversationHandler);
      return;
    }

    if (req.method === "POST" && path === "/level-test") {
      await handleLambda(req, res, levelTestHandler as LambdaHandler);
      return;
    }

    sendJson(res, 404, {
      message: "Not Found",
      path,
    });
  } catch (error) {
    console.error("Local server error:", error);

    sendJson(res, 500, {
      message: "Internal Server Error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Local backend server running at http://localhost:${PORT}`);
});