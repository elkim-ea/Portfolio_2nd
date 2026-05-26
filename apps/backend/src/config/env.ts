import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  AWS_REGION: z.string().default("ap-northeast-2"),
  LEARNING_RECORDS_TABLE_NAME: z.string().min(1),
  USAGE_LIMITS_TABLE_NAME: z.string().min(1),
  BEDROCK_MODEL_ID: z.string().min(1),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.string().default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const getEnv = (): AppEnv => {
  return envSchema.parse(process.env);
};