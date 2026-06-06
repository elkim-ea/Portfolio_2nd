import { apiRequest } from "./client";
import type { UsageLimit } from "../types/usageLimit";

export type UsageApiResponse = {
  message?: string;
  usage: UsageLimit;
};

export function getUsage(): Promise<UsageApiResponse> {
  return apiRequest<UsageApiResponse>("/usage", {
    method: "GET",
  });
}