import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";

export type CorrectionInput = {
  text?: string;
};

export type CorrectionResult = {
  input: string | null;
  correctedText: string;
};

export const correctKoreanText = async (
  input: CorrectionInput,
): Promise<CorrectionResult> => {
  const userId = "dev-user";
  const inputText = input.text ?? "";

  await checkUsageLimit({
    userId,
    type: "correction",
  });

  const result = await generateText({
    task: "correction",
    prompt: inputText,
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
  });

  return {
    input: input.text ?? null,
    correctedText: result.outputText,
  };
};