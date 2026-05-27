import type { LearningLevel } from "./learningRecord.js";

export type CorrectionResultData = {
  correctedKorean: string;
  explanationEnglish: string;
  grammarPoints: string[];
  naturalEnglishMeaning: string;
};

export type ConversationLine = {
  role: "teacher" | "student";
  korean: string;
  romanization: string;
  englishMeaning: string;
};

export type UsefulExpression = {
  korean: string;
  romanization: string;
  englishMeaning: string;
  explanationEnglish: string;
};

export type ConversationResultData = {
  situation: string;
  lines: ConversationLine[];
  usefulExpressions: UsefulExpression[];
  grammarTipEnglish: string;
};

export type LevelTestResultData = {
  estimatedLevel: LearningLevel;
  levelLabel: string;
  explanationEnglish: string;
  weaknesses: string[];
  nextActions: string[];
};

export type AiResponse<
  TType extends "correction" | "conversation" | "level-test",
  TResult,
> = {
  type: TType;
  inputText: string;
  result: TResult;
  outputText: string;
  level?: string;
  savedRecordId?: string;
};