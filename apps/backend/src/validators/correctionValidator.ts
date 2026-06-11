import { z } from "zod";

export const correctionRequestSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
  level: z
    .enum(["a1", "a2", "b1", "b2", "c1", "c2"])
    .optional(),
  explanationLanguage: z
    .enum(["ko", "en", "both"])
    .optional(),
});

export type CorrectionRequestBody = z.infer<typeof correctionRequestSchema>;