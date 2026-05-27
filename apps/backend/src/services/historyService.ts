import { findLearningRecordsByUserId } from "../repositories/learningRecordRepository.js";

const DEFAULT_USER_ID = "dev-user-001";

export type HistoryResult = {
  records: Awaited<ReturnType<typeof findLearningRecordsByUserId>>;
};

export const getLearningHistory = async (): Promise<HistoryResult> => {
  const records = await findLearningRecordsByUserId(DEFAULT_USER_ID, 20);

  return {
    records,
  };
};