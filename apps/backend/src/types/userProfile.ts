export type UserLevel = "beginner" | "intermediate" | "advanced";

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
  currentLevel: "beginner",
  levelLabel: "Beginner A2",
  explanationLanguage: "both",
  conversationTone: "polite",
  learningGoal: "daily",
};

