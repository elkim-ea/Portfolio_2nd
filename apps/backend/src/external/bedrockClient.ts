export type GenerateTextInput = {
  task: "correction" | "conversation";
  prompt: string;
};

export type GenerateTextResult = {
  outputText: string;
};

export const generateText = async (
  input: GenerateTextInput,
): Promise<GenerateTextResult> => {
  if (input.task === "correction") {
    return {
      outputText: "여기에 Bedrock이 생성한 한국어 교정 결과가 들어갈 예정입니다.",
    };
  }

  return {
    outputText: "여기에 Bedrock이 생성한 한국어 회화 결과가 들어갈 예정입니다.",
  };
};