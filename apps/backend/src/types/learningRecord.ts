import type {
  ExplanationLanguage,
  ConversationTone,
} from "./userProfile.js";

export type LearningRecordType = "correction" | "conversation" | "level-test";

export type UserLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type LearningRecord = {
  userId: string;
  recordId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  outputData?: unknown;
  topic?: string | null;
  level?: UserLevel | string | null;
  explanationLanguage?: ExplanationLanguage | null;
  conversationTone?: ConversationTone | null;
  createdAt: string;
};