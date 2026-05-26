import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import {
  checkUsageLimit,
  incrementUsage,
} from "../repositories/usageLimitRepository.js";

export type ConversationInput = {
  topic: string;
};

export type ConversationMessage = {
  role: "teacher" | "student";
  text: string;
};

export type ConversationResult = {
  topic: string;
  conversation: ConversationMessage[];
};

export const generateConversation = async (
  input: ConversationInput,
): Promise<ConversationResult> => {
  const userId = "dev-user";

  await checkUsageLimit({
    userId,
    type: "conversation",
  });

  const result = await generateText({
    task: "conversation",
    prompt: input.topic,
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
  });

  return {
    topic: input.topic,
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