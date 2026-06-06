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
import type {
  UserLevel,
  ConversationTone,
  ExplanationLanguage,
} from "../types/userProfile.js";

export type ConversationInput = {
  userId: string;
  topic?: string;
  level?: UserLevel;
  tone?: ConversationTone;
};

export type ConversationServiceResult = AiResponse<
  "conversation",
  ConversationResultData
>;

function buildConversationPrompt(
  topic: string,
  level: UserLevel,
  conversationTone: ConversationTone,
  explanationLanguage: ExplanationLanguage,
) {
  const levelRule =
    level === "beginner"
      ? "Use short and simple Korean sentences. Avoid difficult grammar. Each Korean line should be easy for beginners."
      : level === "intermediate"
        ? "Use practical intermediate Korean with common grammar patterns and natural expressions."
        : "Use more natural and advanced Korean expressions, including nuance and realistic phrasing.";

  const toneRule =
    conversationTone === "polite"
      ? `
Use polite Korean speech style only.
Use polite endings such as -요, -습니다, -습니까 where natural.
Do not use casual 반말 endings such as -아/-어, -야, -지, -네.
The dialogue may be used with strangers, teachers, staff, or formal situations.
`.trim()
      : `
Use casual Korean speech style only.
Use 반말 endings such as -아/-어, -야, -지, -네.
Do not use polite endings or honorific expressions.
Do not use endings such as -요, -습니다, -습니까, -세요, -입니다, -합니다.
Do not use polite expressions such as 주세요, 괜찮으세요, 하시겠어요, 드릴게요, 부탁드립니다.
If the topic normally requires politeness, reinterpret it as a casual roleplay between close friends.
Every Korean sentence in "lines" and "usefulExpressions" must be casual 반말.
If any Korean sentence contains polite speech, rewrite it into casual Korean before returning JSON.
`.trim();

  const explanationRule =
    explanationLanguage === "ko"
      ? `
Write englishMeaning and explanationEnglish values in Korean only, except romanization.
Keep JSON key names unchanged.
`.trim()
      : explanationLanguage === "en"
        ? `
Write englishMeaning, explanationEnglish, and grammarTipEnglish in English only.
Only Korean dialogue fields may contain Korean.
`.trim()
        : `
Use English as the main explanation language, and include Korean support only where useful.
`.trim();

  return `
User Korean level: ${level}
Conversation tone: ${conversationTone}
Explanation language: ${explanationLanguage}

Level rule:
${levelRule}

Tone rule:
${toneRule}

Explanation rule:
${explanationRule}

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
- lines must include at least 4 lines.
- role must be only "teacher" or "student".
- usefulExpressions must contain 2 to 4 items.
- Korean must match the selected user level.
- Korean must match the selected conversation tone.
- If tone is polite, use polite endings such as -요, -습니다 where natural.
- If tone is casual, every Korean sentence must be 반말.
- If tone is casual, do not include Korean sentences ending with 요, 니다, 까요, 세요, 입니다, 합니다.
- If tone is casual, do not use 주세요, 괜찮으세요, 하시겠어요, 드릴게요, 부탁드립니다.
- If tone is casual, the topic must be treated as a conversation between close friends.
- Do not ignore the selected tone.
- Do not ignore the selected explanation language.
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
  const userId = input.userId;
  const topic = input.topic ?? "ordering food at a restaurant";

  const profile = await getOrCreateUserProfile(userId);

  const selectedLevel = input.level ?? profile.currentLevel;
  const selectedTone = input.tone ?? profile.conversationTone;
  const selectedExplanationLanguage = profile.explanationLanguage;

  await checkUsageLimit({
    userId,
    type: "conversation",
  });

  const bedrockResult = await generateText({
    task: "conversation",
    prompt: buildConversationPrompt(
      topic,
      selectedLevel,
      selectedTone,
      selectedExplanationLanguage,
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
    level: selectedLevel,
    conversationTone: selectedTone,
  });

  return {
    type: "conversation",
    inputText: topic,
    result: structuredResult,
    outputText,
    level: selectedLevel,
  };
};