import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getEnv } from "../config/env.js";

export type LearningRecordType = "correction" | "conversation";

export type SaveLearningRecordInput = {
  userId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  topic?: string;
};

export type LearningRecord = {
  userId: string;
  recordId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  topic?: string;
  createdAt: string;
};

const env = getEnv();

const dynamoDbClient = new DynamoDBClient({
  region: env.AWS_REGION,
});

const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

const createRecordId = (
  createdAt: string,
  type: LearningRecordType,
): string => {
  return `${createdAt}#${type}#${randomUUID()}`;
};

export const saveLearningRecord = async (
  input: SaveLearningRecordInput,
): Promise<LearningRecord> => {
  const createdAt = new Date().toISOString();

  const record: LearningRecord = {
    userId: input.userId,
    recordId: createRecordId(createdAt, input.type),
    type: input.type,
    inputText: input.inputText,
    outputText: input.outputText,
    createdAt,
    ...(input.topic ? { topic: input.topic } : {}),
  };

  await documentClient.send(
    new PutCommand({
      TableName: env.LEARNING_RECORDS_TABLE_NAME,
      Item: record,
      ConditionExpression:
        "attribute_not_exists(userId) AND attribute_not_exists(recordId)",
    }),
  );

  return record;
};