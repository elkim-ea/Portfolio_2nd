import type { LearningLevel } from "../types/learningRecord";

export const LEARNING_LEVEL_OPTIONS: Array<{
  value: LearningLevel;
  label: string;
}> = [
  { value: "a1", label: "A1 Beginner" },
  { value: "a2", label: "A2 Elementary" },
  { value: "b1", label: "B1 Intermediate" },
  { value: "b2", label: "B2 Upper Intermediate" },
  { value: "c1", label: "C1 Advanced" },
  { value: "c2", label: "C2 Proficient" },
];

export function getLearningLevelLabel(level: LearningLevel): string {
  return (
    LEARNING_LEVEL_OPTIONS.find((option) => option.value === level)?.label ??
    "A1 Beginner"
  );
}

export function normalizeLearningLevel(levelText: string): LearningLevel {
  const normalized = levelText.toLowerCase();

  if (normalized.includes("c2")) return "c2";
  if (normalized.includes("c1")) return "c1";
  if (normalized.includes("b2")) return "b2";
  if (normalized.includes("b1")) return "b1";
  if (normalized.includes("a2")) return "a2";
  return "a1";
}