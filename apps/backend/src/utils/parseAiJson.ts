export const parseAiJson = <T>(rawText: string): T => {
  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error(`AI response is not valid JSON: ${trimmed}`);
    }

    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      throw new Error(`Failed to parse AI JSON response: ${trimmed}`);
    }
  }
};