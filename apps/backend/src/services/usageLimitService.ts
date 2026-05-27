import {
  DAILY_USAGE_LIMITS,
  getTodayUsage,
} from "../repositories/usageLimitRepository.js";

const DEFAULT_USER_ID = "dev-user-001";

export type UsageSummary = {
  userId: string;
  usageDate: string;
  correctionCount: number;
  conversationCount: number;
  totalCount: number;
  dailyLimit: number;
  correctionLimit: number;
  conversationLimit: number;
  remainingCount: number;
};

export const getUsageSummary = async (): Promise<UsageSummary> => {
  const usage = await getTodayUsage(DEFAULT_USER_ID);

  return {
    userId: usage.userId,
    usageDate: usage.usageDate,
    correctionCount: usage.correctionCount,
    conversationCount: usage.conversationCount,
    totalCount: usage.totalCount,
    dailyLimit: DAILY_USAGE_LIMITS.total,
    correctionLimit: DAILY_USAGE_LIMITS.correction,
    conversationLimit: DAILY_USAGE_LIMITS.conversation,
    remainingCount: Math.max(DAILY_USAGE_LIMITS.total - usage.totalCount, 0),
  };
};