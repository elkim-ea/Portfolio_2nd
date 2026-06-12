import { z } from "zod";

export const conversationRequestSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required").optional(),
  level: z
    .enum(["a1", "a2", "b1", "b2", "c1", "c2"])
    .optional(),
  tone: z
    .enum(["polite", "casual"])
    .optional(),
});

export type ConversationRequestBody = z.infer<typeof conversationRequestSchema>;