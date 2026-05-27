import { apiRequest } from "./client";
import type { ConversationApiResponse } from "../types/aiResult";

export type ConversationRequest = {
  topic: string;
};

export function requestConversation(
  body: ConversationRequest,
): Promise<ConversationApiResponse> {
  return apiRequest<ConversationApiResponse>("/conversation", {
    method: "POST",
    body,
  });
}