import { apiRequest } from "./client";
import type {
  ConversationTone,
  ExplanationLanguage,
  LearningGoal,
  UserProfile,
} from "../types/userProfile";
import type { LearningLevel } from "../types/learningRecord";

export type ProfileApiResponse = {
  message?: string;
  profile: UserProfile;
};

export type UpdateProfileRequest = {
  currentLevel?: LearningLevel;
  levelLabel?: string;
  explanationLanguage?: ExplanationLanguage;
  conversationTone?: ConversationTone;
  learningGoal?: LearningGoal;
};

export function getProfile(): Promise<ProfileApiResponse> {
  return apiRequest<ProfileApiResponse>("/profile", {
    method: "GET",
  });
}

export function updateProfile(
  body: UpdateProfileRequest,
): Promise<ProfileApiResponse> {
  return apiRequest<ProfileApiResponse>("/profile", {
    method: "PUT",
    body,
  });
}