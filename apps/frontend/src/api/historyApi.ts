import { apiRequest } from "./client";
import type { LearningRecord } from "../types/learningRecord";

export type HistoryApiResponse = {
  message?: string;
  records: LearningRecord[];
};

export function getHistory(): Promise<HistoryApiResponse> {
  return apiRequest<HistoryApiResponse>("/history", {
    method: "GET",
  });
}