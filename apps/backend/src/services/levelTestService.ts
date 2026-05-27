import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import { getOrCreateUserProfile } from "./profileService.js";
import type {
  AiResponse,
  LevelTestResultData,
} from "../types/aiResult.js";

export type LevelTestInput = {
  text?: string;
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

Return:
1. Estimated level: beginner, intermediate, or advanced
2. Level label such as Beginner A2
3. English explanation
4. Weaknesses
5. Next learning actions

Text:
${inputText}
  `.trim();
}

function buildMockStructuredLevelTest(): LevelTestResultData {
  return {
    estimatedLevel: "beginner",
    levelLabel: "Beginner A2",
    explanationEnglish:
      "You can write simple Korean sentences, but your grammar range is still limited. You should continue practising tense, particles, and basic sentence patterns.",
    weaknesses: [
      "Limited sentence variety",
      "Needs more practice with particles",
      "Needs more tense consistency",
    ],
    nextActions: [
      "Practise basic past tense forms.",
      "Review common particles such as 은/는 and 을/를.",
      "Use conversation practice with polite tone.",
    ],
  };
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
  const userId = "dev-user-001";
  const inputText = input.text ?? "";

  const profile = await getOrCreateUserProfile(userId);

  await generateText({
    task: "level-test",
    prompt: buildLevelTestPrompt(inputText, profile.explanationLanguage),
  });

  const structuredResult = buildMockStructuredLevelTest();
  const outputText = formatLevelTestOutput(structuredResult);

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