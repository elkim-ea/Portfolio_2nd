import { findLearningRecordsByUserId } from "../repositories/learningRecordRepository.js";

export type HistoryResult = {
  records: Awaited<ReturnType<typeof findLearningRecordsByUserId>>;
};

export const getLearningHistory = async (
  userId: string,
): Promise<HistoryResult> => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const records = await findLearningRecordsByUserId(userId, 20);

  return {
    records,
  };
};