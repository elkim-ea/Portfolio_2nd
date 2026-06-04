import { getTodayUsage } from "../repositories/usageLimitRepository.js";
import { DAILY_USAGE_LIMITS } from "../types/usageLimit.js";

export type UsageSummary = {
  userId: string;
  usageDate: string;
  correctionCount: number;
  conversationCount: number;
  levelTestCount: number;
  totalCount: number;
  dailyLimit: number;
  correctionLimit: number;
  conversationLimit: number;
  levelTestLimit: number;
  remainingCount: number;
};

export const getUsageSummary = async (
  userId: string,
): Promise<UsageSummary> => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const usage = await getTodayUsage(userId);

  return {
    userId: usage.userId,
    usageDate: usage.usageDate,
    correctionCount: usage.correctionCount,
    conversationCount: usage.conversationCount,
    levelTestCount: usage.levelTestCount,
    totalCount: usage.totalCount,
    dailyLimit: DAILY_USAGE_LIMITS.total,
    correctionLimit: DAILY_USAGE_LIMITS.correction,
    conversationLimit: DAILY_USAGE_LIMITS.conversation,
    levelTestLimit: DAILY_USAGE_LIMITS.levelTest,
    remainingCount: Math.max(DAILY_USAGE_LIMITS.total - usage.totalCount, 0),
  };
};