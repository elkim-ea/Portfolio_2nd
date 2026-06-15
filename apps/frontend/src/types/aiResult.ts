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

export type LearningLevel =
  | "a1"
  | "a2"
  | "b1"
  | "b2"
  | "c1"
  | "c2";

export type LevelTestEstimatedLevel = LearningLevel;

export type LevelTestResultData = {
  estimatedLevel: LevelTestEstimatedLevel;
  levelLabel: string;
  explanationEnglish: string;
  weaknesses: string[];
  nextActions: string[];
};

export type CorrectionApiResponse = {
  type: "correction";
  inputText: string;
  result: CorrectionResultData;
  outputText: string;
  level: string;
};

export type ConversationApiResponse = {
  type: "conversation";
  inputText: string;
  result: ConversationResultData;
  outputText: string;
  level: string;
};

export type LevelTestApiResponse = {
  type: "level-test";
  inputText: string;
  result: LevelTestResultData;
  outputText: string;
  level: string;
};

export type KoreanMateApiResponse =
  | CorrectionApiResponse
  | ConversationApiResponse
  | LevelTestApiResponse;