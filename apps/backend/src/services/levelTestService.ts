import { generateText } from "../external/bedrockClient.js";
import { saveLearningRecord } from "../repositories/learningRecordRepository.js";
import { updateUserProfile } from "./profileService.js";
import type { LevelTestInput, LevelTestResult } from "../types/levelTest.js";
import type {
  ExplanationLanguage,
  LearningGoal,
  UserLevel,
} from "../types/userProfile.js";

const DEFAULT_USER_ID = "dev-user-001";

const estimateLevel = (): {
  currentLevel: UserLevel;
  levelLabel: string;
} => {
  return {
    currentLevel: "beginner",
    levelLabel: "Beginner A2",
  };
};

export const runLevelTest = async (
  input: LevelTestInput,
): Promise<LevelTestResult> => {
  const userId = DEFAULT_USER_ID;
  const inputText = input.inputText ?? "";
  const learningGoal: LearningGoal = input.learningGoal ?? "daily";
  const explanationLanguage: ExplanationLanguage =
    input.explanationLanguage ?? "both";

  const aiResult = await generateText({
    task: "level-test",
    prompt: inputText,
  });

  const estimated = estimateLevel();

  await updateUserProfile(userId, {
    currentLevel: estimated.currentLevel,
    levelLabel: estimated.levelLabel,
    learningGoal,
    explanationLanguage,
  });

  const record = await saveLearningRecord({
    userId,
    type: "level-test",
    inputText,
    outputText: aiResult.outputText,
    level: estimated.levelLabel,
  });

  return {
    inputText,
    currentLevel: estimated.currentLevel,
    levelLabel: estimated.levelLabel,
    reason: aiResult.outputText,
    appliedTo: ["correction", "conversation", "settings"],
    recordId: record.recordId,
  };
};