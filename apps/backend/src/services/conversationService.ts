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

export type ConversationInput = {
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

Return the answer with:
1. Situation
2. Teacher line in Korean
3. Teacher romanization
4. Teacher English meaning
5. Student line in Korean
6. Student romanization
7. Student English meaning
8. Useful expressions
9. English grammar tip
  `.trim();
}

function buildMockStructuredConversation(
  topic: string,
): ConversationResultData {
  return {
    situation: topic,
    lines: [
      {
        role: "teacher",
        korean: "주문하시겠어요?",
        romanization: "Jumunhasigesseoyo?",
        englishMeaning: "Would you like to order?",
      },
      {
        role: "student",
        korean: "네, 김치찌개 하나 주세요.",
        romanization: "Ne, gimchi jjigae hana juseyo.",
        englishMeaning: "Yes, please give me one kimchi stew.",
      },
    ],
    usefulExpressions: [
      {
        korean: "주문하시겠어요?",
        romanization: "Jumunhasigesseoyo?",
        englishMeaning: "Would you like to order?",
        explanationEnglish:
          "This is a polite phrase commonly used by restaurant staff.",
      },
      {
        korean: "하나 주세요.",
        romanization: "Hana juseyo.",
        englishMeaning: "Please give me one.",
        explanationEnglish:
          "'주세요' is a polite request ending used when asking for something.",
      },
    ],
    grammarTipEnglish:
      "The ending '-주세요' is commonly used when politely asking for an item or action.",
  };
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
  const userId = "dev-user-001";
  const topic = input.topic ?? "ordering food at a restaurant";

  const profile = await getOrCreateUserProfile(userId);

  await checkUsageLimit({
    userId,
    type: "conversation",
  });

  await generateText({
    task: "conversation",
    prompt: buildConversationPrompt(
      topic,
      profile.levelLabel,
      profile.conversationTone,
      profile.explanationLanguage,
    ),
  });

  const structuredResult = buildMockStructuredConversation(topic);
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