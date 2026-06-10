export type LearningRecordType = "correction" | "conversation" | "level-test";

export type LearningLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type LearningRecord = {
  userId: string;
  recordId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  outputData?: unknown;
  topic?: string | null;
  level?: string | null;
  createdAt: string;
};