import { apiRequest } from "./client";
import type { CorrectionApiResponse } from "../types/aiResult";

export type CorrectionRequest = {
  text: string;
};

export function requestCorrection(
  body: CorrectionRequest,
): Promise<CorrectionApiResponse> {
  return apiRequest<CorrectionApiResponse>("/correction", {
    method: "POST",
    body,
  });
}