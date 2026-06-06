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
import type {
  UserLevel,
  ExplanationLanguage,
} from "../types/userProfile.js";

export type CorrectionInput = {
  text?: string;
  userId: string;
  level?: UserLevel;
  explanationLanguage?: ExplanationLanguage;
};

export type CorrectionServiceResult = AiResponse<
  "correction",
  CorrectionResultData
>;

function buildCorrectionPrompt(
  inputText: string,
  level: UserLevel,
  explanationLanguage: ExplanationLanguage,
) {
  const levelRule =
    level === "beginner"
      ? "Use very simple explanations. Focus on basic particles, word order, and natural beginner-level Korean."
      : level === "intermediate"
        ? "Use intermediate-level grammar explanations. Include nuance and natural expression improvements."
        : "Use advanced explanations. Focus on nuance, register, style, and native-like Korean.";

  const languageRule =
    explanationLanguage === "ko"
      ? `
Write explanationEnglish and grammarPoints in Korean only.
Do not write English explanations.
Keep the JSON key names unchanged even though the values are Korean.
naturalEnglishMeaning may be written in Korean as a meaning explanation.
`.trim()
      : explanationLanguage === "en"
        ? `
Write explanationEnglish, grammarPoints, and naturalEnglishMeaning in English only.
Do not write Korean explanations in explanationEnglish.
Only correctedKorean may contain Korean.
If you mention Korean grammar examples, keep them short and explain them in English.
`.trim()
        : `
Write explanationEnglish and grammarPoints with both Korean and English where useful.
correctedKorean must be Korean.
naturalEnglishMeaning must include a clear English meaning.
`.trim();

  return `
User Korean level: ${level}
Explanation language: ${explanationLanguage}

Level rule:
${levelRule}

Language rule:
${languageRule}

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
- explanationEnglish must follow the selected explanation language rule.
- grammarPoints must contain 2 to 5 items.
- naturalEnglishMeaning must follow the selected explanation language rule.
- The difficulty of the explanation must match the selected user level.
- If Explanation language is "en", explanationEnglish must be English only.
- If Explanation language is "ko", explanationEnglish must be Korean only even though the key name is explanationEnglish.
- If Explanation language is "both", explanationEnglish may include both Korean and English.
- Do not ignore the selected explanation language.

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
  const userId = input.userId;
  const inputText = input.text ?? "";

  const profile = await getOrCreateUserProfile(userId);

  const selectedLevel = input.level ?? profile.currentLevel;
  const selectedExplanationLanguage =
    input.explanationLanguage ?? profile.explanationLanguage;

  await checkUsageLimit({
    userId,
    type: "correction",
  });

  const bedrockResult = await generateText({
    task: "correction",
    prompt: buildCorrectionPrompt(
      inputText,
      selectedLevel,
      selectedExplanationLanguage,
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
    level: selectedLevel,
    explanationLanguage: selectedExplanationLanguage,
  });

  return {
    type: "correction",
    inputText,
    result: structuredResult,
    outputText,
    level: selectedLevel,
  };
};