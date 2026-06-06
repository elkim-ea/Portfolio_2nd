export type UsageLimit = {
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
  ttl?: number;
};