export type UserLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type ExplanationLanguage = "ko" | "en" | "both";

export type ConversationTone = "polite" | "casual";

export type LearningGoal = "daily" | "travel" | "business";

export type UserProfile = {
  userId: string;
  currentLevel: UserLevel;
  levelLabel: string;
  explanationLanguage: ExplanationLanguage;
  conversationTone: ConversationTone;
  learningGoal: LearningGoal;
  updatedAt: string;
};

export type UpdateUserProfileInput = {
  currentLevel?: UserLevel;
  levelLabel?: string;
  explanationLanguage?: ExplanationLanguage;
  conversationTone?: ConversationTone;
  learningGoal?: LearningGoal;
};

export const DEFAULT_USER_PROFILE: Omit<UserProfile, "userId" | "updatedAt"> = {
  currentLevel: "a1",
  levelLabel: "A1 Beginner",
  explanationLanguage: "both",
  conversationTone: "polite",
  learningGoal: "daily",
};

