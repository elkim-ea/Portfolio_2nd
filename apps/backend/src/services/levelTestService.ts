import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import { getOrCreateUserProfile } from "./profileService.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";
import type {
  AiResponse,
  LevelTestResultData,
} from "../types/aiResult.js";
import { parseAiJson } from "../utils/parseAiJson.js";

export type LevelTestInput = {
  text?: string;
  userId: string;
};

export type LevelTestServiceResult = AiResponse<
  "level-test",
  LevelTestResultData
>;

function buildLevelTestPrompt(
  inputText: string,
  explanationLanguage: string,
) {
  return `
Explanation language: ${explanationLanguage}

You are a Korean tutor for foreign learners.

Evaluate the user's Korean level based on the following Korean text.

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any text outside JSON.

JSON schema:
{
  "estimatedLevel": "beginner",
  "levelLabel": "Beginner A2",
  "explanationEnglish": "string",
  "weaknesses": ["string"],
  "nextActions": ["string"]
}

Allowed estimatedLevel values:
- beginner
- intermediate
- advanced

Rules:
- estimatedLevel must be one of: beginner, intermediate, advanced.
- levelLabel should be like Beginner A1, Beginner A2, Intermediate B1, Intermediate B2, Advanced C1.
- weaknesses must contain 2 to 5 items.
- nextActions must contain 2 to 5 items.

Text:
${inputText}
  `.trim();
}

function formatLevelTestOutput(result: LevelTestResultData): string {
  return [
    `Estimated Level: ${result.levelLabel}`,
    "",
    `Explanation: ${result.explanationEnglish}`,
    "",
    "Weaknesses:",
    ...result.weaknesses.map((weakness) => `- ${weakness}`),
    "",
    "Next Actions:",
    ...result.nextActions.map((action) => `- ${action}`),
  ].join("\n");
}

export const runLevelTest = async (
  input: LevelTestInput,
): Promise<LevelTestServiceResult> => {
 
  const inputText = input.text ?? "";
  const userId = input.userId;
  
  const profile = await getOrCreateUserProfile(userId);

await checkUsageLimit({
  userId,
  type: "level-test",
});

const bedrockResult = await generateText({
  task: "level-test",
  prompt: buildLevelTestPrompt(inputText, profile.explanationLanguage),
});

const structuredResult = parseAiJson<LevelTestResultData>(
  bedrockResult.outputText,
);

  const outputText = formatLevelTestOutput(structuredResult);

await incrementUsage({
  userId,
  type: "level-test",
});

await saveLearningRecord({
  userId,
  type: "level-test",
  inputText,
  outputText,
  outputData: structuredResult,
  level: structuredResult.levelLabel,
});

  return {
    type: "level-test",
    inputText,
    result: structuredResult,
    outputText,
    level: structuredResult.levelLabel,
  };
};