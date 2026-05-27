import { apiRequest } from "./client";
import type { LevelTestApiResponse } from "../types/aiResult";

export type LevelTestRequest = {
  text: string;
};

export function requestLevelTest(
  body: LevelTestRequest,
): Promise<LevelTestApiResponse> {
  return apiRequest<LevelTestApiResponse>("/level-test", {
    method: "POST",
    body,
  });
}