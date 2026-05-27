import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import { getEnv } from "../config/env.js";
import {
  DEFAULT_USER_PROFILE,
  type UpdateUserProfileInput,
  type UserProfile,
} from "../types/userProfile.js";

const env = getEnv();

const dynamoDbClient = new DynamoDBClient({
  region: env.AWS_REGION,
});

const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const result = await documentClient.send(
    new GetCommand({
      TableName: env.USER_PROFILES_TABLE_NAME,
      Key: {
        userId,
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as UserProfile;
}

export async function createDefaultUserProfile(
  userId: string
): Promise<UserProfile> {
  const now = new Date().toISOString();

  const profile: UserProfile = {
    userId,
    ...DEFAULT_USER_PROFILE,
    updatedAt: now,
  };

  await documentClient.send(
    new PutCommand({
      TableName: env.USER_PROFILES_TABLE_NAME,
      Item: profile,
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );

  return profile;
}

export async function saveUserProfile(
  profile: UserProfile
): Promise<UserProfile> {
  await documentClient.send(
    new PutCommand({
      TableName: env.USER_PROFILES_TABLE_NAME,
      Item: profile,
    })
  );

  return profile;
}

export async function updateUserProfileItem(
  userId: string,
  input: UpdateUserProfileInput
): Promise<UserProfile> {
  const existing = await getUserProfile(userId);
  const now = new Date().toISOString();

  const profile: UserProfile = {
    userId,
    currentLevel:
      input.currentLevel ??
      existing?.currentLevel ??
      DEFAULT_USER_PROFILE.currentLevel,
    levelLabel:
      input.levelLabel ??
      existing?.levelLabel ??
      DEFAULT_USER_PROFILE.levelLabel,
    explanationLanguage:
      input.explanationLanguage ??
      existing?.explanationLanguage ??
      DEFAULT_USER_PROFILE.explanationLanguage,
    conversationTone:
      input.conversationTone ??
      existing?.conversationTone ??
      DEFAULT_USER_PROFILE.conversationTone,
    learningGoal:
      input.learningGoal ??
      existing?.learningGoal ??
      DEFAULT_USER_PROFILE.learningGoal,
    updatedAt: now,
  };

  return saveUserProfile(profile);
}