import type {
  ConversationTone,
  ExplanationLanguage,
  LearningGoal,
  UpdateUserProfileInput,
  UserLevel,
} from "../types/userProfile.js";

const USER_LEVELS: UserLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];
const EXPLANATION_LANGUAGES: ExplanationLanguage[] = ["ko", "en", "both"];
const CONVERSATION_TONES: ConversationTone[] = ["polite", "casual"];
const LEARNING_GOALS: LearningGoal[] = ["daily", "travel", "business"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateUpdateUserProfileInput(
  body: unknown
): UpdateUserProfileInput {
  if (!isObject(body)) {
    throw new Error("Request body must be an object");
  }

  const input: UpdateUserProfileInput = {};

  if (body.currentLevel !== undefined) {
    if (
      typeof body.currentLevel !== "string" ||
      !USER_LEVELS.includes(body.currentLevel as UserLevel)
    ) {
      throw new Error(
        "currentLevel must be one of: beginner, intermediate, advanced"
      );
    }

    input.currentLevel = body.currentLevel as UserLevel;
  }

  if (body.levelLabel !== undefined) {
    if (typeof body.levelLabel !== "string" || body.levelLabel.trim() === "") {
      throw new Error("levelLabel must be a non-empty string");
    }

    input.levelLabel = body.levelLabel.trim();
  }

  if (body.explanationLanguage !== undefined) {
    if (
      typeof body.explanationLanguage !== "string" ||
      !EXPLANATION_LANGUAGES.includes(
        body.explanationLanguage as ExplanationLanguage
      )
    ) {
      throw new Error("explanationLanguage must be one of: ko, en, both");
    }

    input.explanationLanguage =
      body.explanationLanguage as ExplanationLanguage;
  }

  if (body.conversationTone !== undefined) {
    if (
      typeof body.conversationTone !== "string" ||
      !CONVERSATION_TONES.includes(body.conversationTone as ConversationTone)
    ) {
      throw new Error("conversationTone must be one of: polite, casual");
    }

    input.conversationTone = body.conversationTone as ConversationTone;
  }

  if (body.learningGoal !== undefined) {
    if (
      typeof body.learningGoal !== "string" ||
      !LEARNING_GOALS.includes(body.learningGoal as LearningGoal)
    ) {
      throw new Error("learningGoal must be one of: daily, travel, business");
    }

    input.learningGoal = body.learningGoal as LearningGoal;
  }

  return input;
}