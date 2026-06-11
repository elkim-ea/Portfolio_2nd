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

export type LevelTestEstimatedLevel =
  | "a1"
  | "a2"
  | "b1"
  | "b2"
  | "c1"
  | "c2";

export type LevelTestResultData = {
  estimatedLevel: LevelTestEstimatedLevel;
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
  level: string;
};

export type CorrectionApiResponse = AiResponse<
  "correction",
  CorrectionResultData
>;

export type ConversationApiResponse = AiResponse<
  "conversation",
  ConversationResultData
>;

export type LevelTestApiResponse = AiResponse<
  "level-test",
  LevelTestResultData
>;

export type KoreanMateApiResponse =
  | CorrectionApiResponse
  | ConversationApiResponse
  | LevelTestApiResponse;