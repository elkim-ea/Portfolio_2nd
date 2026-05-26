import { z } from "zod";

export const conversationRequestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, "Topic must not be empty")
    .max(100, "Topic must be 100 characters or less")
    .optional()
    .default("daily conversation"),
});

export type ConversationRequestBody = z.input<
  typeof conversationRequestSchema
>;

export type ValidatedConversationRequestBody = z.output<
  typeof conversationRequestSchema
>;