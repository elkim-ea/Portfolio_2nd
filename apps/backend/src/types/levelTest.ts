import type {
  ExplanationLanguage,
  LearningGoal,
  UserLevel,
} from "./userProfile.js";

export type LevelTestInput = {
  inputText?: string;
  learningGoal?: LearningGoal;
  explanationLanguage?: ExplanationLanguage;
};

export type LevelTestResult = {
  inputText: string;
  currentLevel: UserLevel;
  levelLabel: string;
  reason: string;
  appliedTo: string[];
  recordId: string;
};