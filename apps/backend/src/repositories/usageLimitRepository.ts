import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getEnv } from "../config/env.js";
import {
  DAILY_USAGE_LIMITS,
  UsageLimitExceededError,
  type CheckUsageLimitInput,
  type IncrementUsageInput,
  type UsageLimit,
} from "../types/usageLimit.js";

const env = getEnv();

const dynamoDbClient = new DynamoDBClient({
  region: env.AWS_REGION,
});

const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const getTodayDate = (): string => {
  const now = new Date();
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffsetMs);

  return kstDate.toISOString().slice(0, 10);
};

const getTtlAfterDays = (days: number): number => {
  return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * days;
};

const createEmptyUsage = (userId: string, usageDate: string): UsageLimit => {
  return {
    userId,
    usageDate,
    correctionCount: 0,
    conversationCount: 0,
    levelTestCount: 0,
    totalCount: 0,
    ttl: getTtlAfterDays(30),
  };
};

export const getTodayUsage = async (userId: string): Promise<UsageLimit> => {
  const usageDate = getTodayDate();

  const result = await documentClient.send(
    new GetCommand({
      TableName: env.USAGE_LIMITS_TABLE_NAME,
      Key: {
        userId,
        usageDate,
      },
    }),
  );

  if (!result.Item) {
    return createEmptyUsage(userId, usageDate);
  }

  const item = result.Item as Partial<UsageLimit>;

  return {
    userId,
    usageDate,
    correctionCount: item.correctionCount ?? 0,
    conversationCount: item.conversationCount ?? 0,
    levelTestCount: item.levelTestCount ?? 0,
    totalCount: item.totalCount ?? 0,
    ttl: item.ttl ?? getTtlAfterDays(30),
  };
};

export const checkUsageLimit = async (
  input: CheckUsageLimitInput,
): Promise<void> => {
  const usage = await getTodayUsage(input.userId);

  if (usage.totalCount >= DAILY_USAGE_LIMITS.total) {
    throw new UsageLimitExceededError();
  }

  if (
    input.type === "correction" &&
    usage.correctionCount >= DAILY_USAGE_LIMITS.correction
  ) {
    throw new UsageLimitExceededError("Daily correction usage limit exceeded.");
  }

  if (
    input.type === "conversation" &&
    usage.conversationCount >= DAILY_USAGE_LIMITS.conversation
  ) {
    throw new UsageLimitExceededError(
      "Daily conversation usage limit exceeded.",
    );
  }

  if (
    input.type === "level-test" &&
    usage.levelTestCount >= DAILY_USAGE_LIMITS.levelTest
  ) {
    throw new UsageLimitExceededError("Daily level test usage limit exceeded.");
  }
};

const getCountAttributeName = (
  type: IncrementUsageInput["type"],
): "correctionCount" | "conversationCount" | "levelTestCount" => {
  if (type === "correction") {
    return "correctionCount";
  }

  if (type === "conversation") {
    return "conversationCount";
  }

  return "levelTestCount";
};

export const incrementUsage = async (
  input: IncrementUsageInput,
): Promise<UsageLimit> => {
  const usageDate = getTodayDate();
  const ttl = getTtlAfterDays(30);
  const countAttributeName = getCountAttributeName(input.type);

  const expressionAttributeNames: Record<string, string> = {
    "#ttl": "ttl",
    "#totalCount": "totalCount",
    "#targetCount": countAttributeName,
  };

  const baseSetExpressions = [
    "#ttl = if_not_exists(#ttl, :ttl)",
    "#targetCount = if_not_exists(#targetCount, :zero) + :one",
    "#totalCount = if_not_exists(#totalCount, :zero) + :one",
  ];

  if (countAttributeName !== "correctionCount") {
    expressionAttributeNames["#correctionCount"] = "correctionCount";
    baseSetExpressions.push(
      "#correctionCount = if_not_exists(#correctionCount, :zero)",
    );
  }

  if (countAttributeName !== "conversationCount") {
    expressionAttributeNames["#conversationCount"] = "conversationCount";
    baseSetExpressions.push(
      "#conversationCount = if_not_exists(#conversationCount, :zero)",
    );
  }

  if (countAttributeName !== "levelTestCount") {
    expressionAttributeNames["#levelTestCount"] = "levelTestCount";
    baseSetExpressions.push(
      "#levelTestCount = if_not_exists(#levelTestCount, :zero)",
    );
  }

  const result = await documentClient.send(
    new UpdateCommand({
      TableName: env.USAGE_LIMITS_TABLE_NAME,
      Key: {
        userId: input.userId,
        usageDate,
      },
      UpdateExpression: `SET ${baseSetExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: {
        ":ttl": ttl,
        ":zero": 0,
        ":one": 1,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return result.Attributes as UsageLimit;
};