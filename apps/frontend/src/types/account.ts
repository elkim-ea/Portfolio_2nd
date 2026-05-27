export type AccountPlan = "Free Plan" | "Pro Plan";

export type AccountInfo = {
  userId: string;
  email: string;
  plan: AccountPlan;
  accountStatus: "active" | "pending" | "disabled";
  provider: "cognito";
  createdAt: string;
  lastLoginAt?: string | null;
};