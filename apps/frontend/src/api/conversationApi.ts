import { apiRequest } from "./client";
import type { ConversationApiResponse } from "../types/aiResult";
import type { LearningLevel } from "../types/learningRecord";
import type { ConversationTone } from "../types/userProfile";

export type ConversationRequest = {
  topic: string;
  level?: LearningLevel;
  tone?: ConversationTone;
};

export function requestConversation(
  body: ConversationRequest,
): Promise<ConversationApiResponse> {
  return apiRequest<ConversationApiResponse>("/conversation", {
    method: "POST",
    body,
  });
}