export type GenerateTextInput = {
  task: "correction" | "conversation" | "level-test";
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

  if (input.task === "conversation") {
    return {
      outputText: "여기에 Bedrock이 생성한 한국어 회화 결과가 들어갈 예정입니다.",
    };
  }

  return {
    outputText:
      "Estimated Level: Beginner A2\nReason: 기본적인 자기소개 표현은 가능하지만 문장 연결과 어휘 다양성이 아직 제한적입니다.",
  };
};