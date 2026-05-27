import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";
import { getOrCreateUserProfile } from "./profileService.js";

export type CorrectionInput = {
  text?: string;
};

export type CorrectionResult = {
  input: string | null;
  correctedText: string;
  level: string;
};

export const correctKoreanText = async (
  input: CorrectionInput,
): Promise<CorrectionResult> => {
  const userId = "dev-user-001";
  const inputText = input.text ?? "";

  const profile = await getOrCreateUserProfile(userId);

  await checkUsageLimit({
    userId,
    type: "correction",
  });

  const result = await generateText({
    task: "correction",
    prompt: `
User Korean level: ${profile.levelLabel}
Explanation language: ${profile.explanationLanguage}

Please correct the following Korean text based on the user's level.

Text:
${inputText}
    `.trim(),
  });

  await incrementUsage({
    userId,
    type: "correction",
  });

  await saveLearningRecord({
    userId,
    type: "correction",
    inputText,
    outputText: result.outputText,
    level: profile.levelLabel,
  });

  return {
    input: input.text ?? null,
    correctedText: result.outputText,
    level: profile.levelLabel,
  };
};