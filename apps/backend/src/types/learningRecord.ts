import type {
  ExplanationLanguage,
  ConversationTone,
} from "./userProfile.js";

export type LearningRecordType = "correction" | "conversation" | "level-test";

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type LearningRecord = {
  userId: string;
  recordId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  outputData?: unknown;
  topic?: string | null;
  level?: LearningLevel | string | null;
  explanationLanguage?: ExplanationLanguage | null;
  conversationTone?: ConversationTone | null;
  createdAt: string;
};