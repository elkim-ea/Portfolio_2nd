import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";
import { getOrCreateUserProfile } from "./profileService.js";

export type ConversationInput = {
  topic: string;
};

export type ConversationMessage = {
  role: "teacher" | "student";
  text: string;
};

export type ConversationResult = {
  topic: string;
  level: string;
  conversation: ConversationMessage[];
};

export const generateConversation = async (
  input: ConversationInput,
): Promise<ConversationResult> => {
  const userId = "dev-user-001";

  const profile = await getOrCreateUserProfile(userId);

  await checkUsageLimit({
    userId,
    type: "conversation",
  });

  const result = await generateText({
    task: "conversation",
    prompt: `
User Korean level: ${profile.levelLabel}
Conversation tone: ${profile.conversationTone}
Learning goal: ${profile.learningGoal}

Create a Korean conversation for this situation.
Use vocabulary and sentence length appropriate for the user's level.

Situation:
${input.topic}
    `.trim(),
  });

  await incrementUsage({
    userId,
    type: "conversation",
  });

  await saveLearningRecord({
    userId,
    type: "conversation",
    inputText: input.topic,
    outputText: result.outputText,
    topic: input.topic,
    level: profile.levelLabel,
  });

  return {
    topic: input.topic,
    level: profile.levelLabel,
    conversation: [
      {
        role: "teacher",
        text: result.outputText,
      },
      {
        role: "student",
        text: "이 표현을 따라서 연습해볼게요.",
      },
    ],
  };
};