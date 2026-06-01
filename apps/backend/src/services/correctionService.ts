import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";
import { getOrCreateUserProfile } from "./profileService.js";
import type {
  AiResponse,
  CorrectionResultData,
} from "../types/aiResult.js";
import { parseAiJson } from "../utils/parseAiJson.js";

export type CorrectionInput = {
  text?: string;
  userId: string;
};

export type CorrectionServiceResult = AiResponse<
  "correction",
  CorrectionResultData
>;

function buildCorrectionPrompt(
  inputText: string,
  levelLabel: string,
  explanationLanguage: string,
) {
  return `
User Korean level: ${levelLabel}
Explanation language: ${explanationLanguage}

You are a Korean tutor for foreign learners.

Correct the following Korean text.

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any text outside JSON.

JSON schema:
{
  "correctedKorean": "string",
  "explanationEnglish": "string",
  "grammarPoints": ["string"],
  "naturalEnglishMeaning": "string"
}

Rules:
- correctedKorean must be natural Korean.
- explanationEnglish must explain the correction clearly.
- grammarPoints must contain 2 to 5 items.
- naturalEnglishMeaning must explain the meaning of the corrected Korean sentence.

Text:
${inputText}
  `.trim();
}

function formatCorrectionOutput(result: CorrectionResultData): string {
  return [
    `Corrected Korean: ${result.correctedKorean}`,
    "",
    `Explanation: ${result.explanationEnglish}`,
    "",
    "Grammar Points:",
    ...result.grammarPoints.map((point) => `- ${point}`),
    "",
    `Natural English Meaning: ${result.naturalEnglishMeaning}`,
  ].join("\n");
}

export const correctKoreanText = async (
  input: CorrectionInput,
): Promise<CorrectionServiceResult> => {
  const { userId } = input;
  const inputText = input.text ?? "";

  const profile = await getOrCreateUserProfile(userId);

  await checkUsageLimit({
    userId,
    type: "correction",
  });

  const bedrockResult = await generateText({
    task: "correction",
    prompt: buildCorrectionPrompt(
      inputText,
      profile.levelLabel,
      profile.explanationLanguage,
    ),
  });

  const structuredResult = parseAiJson<CorrectionResultData>(
  bedrockResult.outputText,
);

  const outputText = formatCorrectionOutput(structuredResult);

  await incrementUsage({
    userId,
    type: "correction",
  });

  await saveLearningRecord({
    userId,
    type: "correction",
    inputText,
    outputText,
    outputData: structuredResult,
    level: profile.levelLabel,
  });

  return {
    type: "correction",
    inputText,
    result: structuredResult,
    outputText,
    level: profile.levelLabel,
  };
};