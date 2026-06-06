import { apiRequest } from "./client";
import type { CorrectionApiResponse } from "../types/aiResult";
import type { LearningLevel } from "../types/learningRecord";
import type { ExplanationLanguage } from "../types/userProfile";

export type CorrectionRequest = {
  text: string;
  level?: LearningLevel;
  explanationLanguage?: ExplanationLanguage;
};

export function requestCorrection(
  body: CorrectionRequest,
): Promise<CorrectionApiResponse> {
  return apiRequest<CorrectionApiResponse>("/correction", {
    method: "POST",
    body,
  });
}