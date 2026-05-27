export type LearningRecordType = "correction" | "conversation" | "level-test";

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type LearningRecord = {
  userId: string;
  recordId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  topic?: string | null;
  level?: LearningLevel | null;
  createdAt: string;
};