export type UsageType = "correction" | "conversation" | "level-test";

export type UsageLimit = {
  userId: string;
  usageDate: string;
  correctionCount: number;
  conversationCount: number;
  levelTestCount: number;
  totalCount: number;
  ttl: number;
};

export type CheckUsageLimitInput = {
  userId: string;
  type: UsageType;
};

export type IncrementUsageInput = {
  userId: string;
  type: UsageType;
};

export const DAILY_USAGE_LIMITS = {
  correction: 10,
  conversation: 10,
  levelTest: 5,
  total: 25,
} as const;

export class UsageLimitExceededError extends Error {
  constructor(message = "Daily AI usage limit exceeded.") {
    super(message);
    this.name = "UsageLimitExceededError";
  }
}