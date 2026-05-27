import type {
  ExplanationLanguage,
  LearningGoal,
} from "../types/userProfile.js";
import type { LevelTestInput } from "../types/levelTest.js";

const LEARNING_GOALS: LearningGoal[] = ["daily", "travel", "business"];
const EXPLANATION_LANGUAGES: ExplanationLanguage[] = ["ko", "en", "both"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const validateLevelTestInput = (body: unknown): LevelTestInput => {
  if (!isObject(body)) {
    throw new Error("Request body must be an object");
  }

  if (typeof body.inputText !== "string" || body.inputText.trim() === "") {
    throw new Error("inputText is required");
  }

  if (body.inputText.length > 500) {
    throw new Error("inputText must be less than or equal to 500 characters");
  }

  const input: LevelTestInput = {
    inputText: body.inputText.trim(),
  };

  if (body.learningGoal !== undefined) {
    if (
      typeof body.learningGoal !== "string" ||
      !LEARNING_GOALS.includes(body.learningGoal as LearningGoal)
    ) {
      throw new Error("learningGoal must be one of: daily, travel, business");
    }

    input.learningGoal = body.learningGoal as LearningGoal;
  }

  if (body.explanationLanguage !== undefined) {
    if (
      typeof body.explanationLanguage !== "string" ||
      !EXPLANATION_LANGUAGES.includes(
        body.explanationLanguage as ExplanationLanguage,
      )
    ) {
      throw new Error("explanationLanguage must be one of: ko, en, both");
    }

    input.explanationLanguage = body.explanationLanguage as ExplanationLanguage;
  }

  return input;
};