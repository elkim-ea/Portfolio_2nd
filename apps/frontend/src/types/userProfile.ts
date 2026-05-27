import type { LearningLevel } from "./learningRecord";

export type ExplanationLanguage = "ko" | "en" | "both";
export type ConversationTone = "polite" | "casual";
export type LearningGoal = "daily" | "travel" | "business";

export type UserProfile = {
  userId: string;
  currentLevel: LearningLevel;
  levelLabel: string;
  explanationLanguage: ExplanationLanguage;
  conversationTone: ConversationTone;
  learningGoal?: LearningGoal | null;
  updatedAt: string;
};