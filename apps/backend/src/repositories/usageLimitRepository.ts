import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getEnv } from "../config/env.js";

export type UsageType = "correction" | "conversation";

export type UsageLimit = {
  userId: string;
  usageDate: string;
  correctionCount: number;
  conversationCount: number;
  totalCount: number;
  ttl: number;
};

export type CheckUsageLimitInput = {
  userId: string;
  type: UsageType;
};

export type IncrementUsageInput = {
  userId: string;
  type: UsageType;
};

export const DAILY_USAGE_LIMITS = {
  correction: 10,
  conversation: 10,
  total: 20,
} as const;

const env = getEnv();

const dynamoDbClient = new DynamoDBClient({
  region: env.AWS_REGION,
});

const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const getTodayDate = (): string => {
  return new Date().toISOString().slice(0, 10);
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
    totalCount: 0,
    ttl: getTtlAfterDays(30),
  };
};

export class UsageLimitExceededError extends Error {
  constructor(message = "Daily AI usage limit exceeded.") {
    super(message);
    this.name = "UsageLimitExceededError";
  }
}

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

  return result.Item as UsageLimit;
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
};

export const incrementUsage = async (
  input: IncrementUsageInput,
): Promise<UsageLimit> => {
  const usageDate = getTodayDate();
  const ttl = getTtlAfterDays(30);

  const isCorrection = input.type === "correction";

  const updateExpression = isCorrection
    ? `
      SET
        #ttl = if_not_exists(#ttl, :ttl),
        #correctionCount = if_not_exists(#correctionCount, :zero) + :one,
        #conversationCount = if_not_exists(#conversationCount, :zero),
        #totalCount = if_not_exists(#totalCount, :zero) + :one
    `
    : `
      SET
        #ttl = if_not_exists(#ttl, :ttl),
        #correctionCount = if_not_exists(#correctionCount, :zero),
        #conversationCount = if_not_exists(#conversationCount, :zero) + :one,
        #totalCount = if_not_exists(#totalCount, :zero) + :one
    `;

  const result = await documentClient.send(
    new UpdateCommand({
      TableName: env.USAGE_LIMITS_TABLE_NAME,
      Key: {
        userId: input.userId,
        usageDate,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        "#ttl": "ttl",
        "#correctionCount": "correctionCount",
        "#conversationCount": "conversationCount",
        "#totalCount": "totalCount",
      },
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