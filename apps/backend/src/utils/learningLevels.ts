export const LEARNING_LEVEL_LABELS: Record<"a1" | "a2" | "b1" | "b2" | "c1" | "c2", string> = {
  a1: "A1 Beginner",
  a2: "A2 Elementary",
  b1: "B1 Intermediate",
  b2: "B2 Upper Intermediate",
  c1: "C1 Advanced",
  c2: "C2 Proficient",
};

export function normalizeLearningLevel(level: string | undefined | null): keyof typeof LEARNING_LEVEL_LABELS {
  if (!level) {
    return "a1";
  }

  const normalized = level.toLowerCase();

  if (normalized === "c2" || normalized.includes("c2")) return "c2";
  if (normalized === "c1" || normalized.includes("c1")) return "c1";
  if (normalized === "b2" || normalized.includes("b2")) return "b2";
  if (normalized === "b1" || normalized.includes("b1")) return "b1";
  if (normalized === "a2" || normalized.includes("a2")) return "a2";
  if (normalized === "a1" || normalized.includes("a1")) return "a1";

  if (normalized.includes("advanced")) return "c1";
  if (normalized.includes("intermediate")) return "b1";
  if (normalized.includes("beginner")) return "a1";

  return "a1";
}

export function getLevelInstruction(level: string | undefined | null): string {
  const normalizedLevel = normalizeLearningLevel(level);

  return LEARNING_LEVEL_LABELS[normalizedLevel] ?? LEARNING_LEVEL_LABELS.a1;
}