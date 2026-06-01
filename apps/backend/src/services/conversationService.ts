import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";
import { getOrCreateUserProfile } from "./profileService.js";
import type {
  AiResponse,
  ConversationResultData,
} from "../types/aiResult.js";
import { parseAiJson } from "../utils/parseAiJson.js";

export type ConversationInput = {
  userId: string;
  topic?: string;
};

export type ConversationServiceResult = AiResponse<
  "conversation",
  ConversationResultData
>;

function buildConversationPrompt(
  topic: string,
  levelLabel: string,
  conversationTone: string,
  explanationLanguage: string,
) {
  return `
User Korean level: ${levelLabel}
Conversation tone: ${conversationTone}
Explanation language: ${explanationLanguage}

You are a Korean tutor for foreign learners.

Create a short Korean conversation for this topic:
${topic}

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any text outside JSON.

JSON schema:
{
  "situation": "string",
  "lines": [
    {
      "role": "teacher",
      "korean": "string",
      "romanization": "string",
      "englishMeaning": "string"
    },
    {
      "role": "student",
      "korean": "string",
      "romanization": "string",
      "englishMeaning": "string"
    }
  ],
  "usefulExpressions": [
    {
      "korean": "string",
      "romanization": "string",
      "englishMeaning": "string",
      "explanationEnglish": "string"
    }
  ],
  "grammarTipEnglish": "string"
}

Rules:
- lines must include at least 2 lines.
- role must be only "teacher" or "student".
- usefulExpressions must contain 2 to 4 items.
- Korean should match the user's level.
  `.trim();
}

function formatConversationOutput(result: ConversationResultData): string {
  const lines = result.lines.flatMap((line) => [
    `${line.role === "teacher" ? "Teacher" : "Student"}: ${line.korean}`,
    `Romanization: ${line.romanization}`,
    `Meaning: ${line.englishMeaning}`,
    "",
  ]);

  const expressions = result.usefulExpressions.flatMap((expression, index) => [
    `${index + 1}. ${expression.korean}`,
    `Romanization: ${expression.romanization}`,
    `Meaning: ${expression.englishMeaning}`,
    `Explanation: ${expression.explanationEnglish}`,
    "",
  ]);

  return [
    `Situation: ${result.situation}`,
    "",
    ...lines,
    "Useful Expressions:",
    ...expressions,
    `Grammar Tip: ${result.grammarTipEnglish}`,
  ].join("\n");
}

export const generateConversation = async (
  input: ConversationInput,
): Promise<ConversationServiceResult> => {
  const topic = input.topic ?? "ordering food at a restaurant";
  const userId = input.userId;

  const profile = await getOrCreateUserProfile(userId);

  await checkUsageLimit({
    userId,
    type: "conversation",
  });

  const bedrockResult = await generateText({
  task: "conversation",
  prompt: buildConversationPrompt(
    topic,
    profile.levelLabel,
    profile.conversationTone,
    profile.explanationLanguage,
  ),
});

const structuredResult = parseAiJson<ConversationResultData>(
  bedrockResult.outputText,
);
  const outputText = formatConversationOutput(structuredResult);

  await incrementUsage({
    userId,
    type: "conversation",
  });

  await saveLearningRecord({
    userId,
    type: "conversation",
    inputText: topic,
    outputText,
    outputData: structuredResult,
    topic,
    level: profile.levelLabel,
  });

  return {
    type: "conversation",
    inputText: topic,
    result: structuredResult,
    outputText,
    level: profile.levelLabel,
  };
};