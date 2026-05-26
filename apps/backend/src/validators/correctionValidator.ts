import { z } from "zod";

export const correctionRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Text is required")
    .max(2000, "Text must be 2000 characters or less"),
});

export type CorrectionRequestBody = z.infer<typeof correctionRequestSchema>;