import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

export type GenerateTextInput = {
  task: "correction" | "conversation" | "level-test";
  prompt: string;
};

export type GenerateTextResult = {
  outputText: string;
};

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const bedrockClient = new BedrockRuntimeClient({
  region: requiredEnv("AWS_REGION"),
});

export const generateText = async (
  input: GenerateTextInput,
): Promise<GenerateTextResult> => {
  const modelId = requiredEnv("BEDROCK_MODEL_ID");

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: "user",
        content: [
          {
            text: input.prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 1200,
      temperature: 0.2,
      topP: 0.9,
    },
  });

  const response = await bedrockClient.send(command);

  const outputText =
    response.output?.message?.content
      ?.map((content) => content.text ?? "")
      .join("")
      .trim() ?? "";

  if (!outputText) {
    throw new Error(`Bedrock returned an empty response for task: ${input.task}`);
  }

  return {
    outputText,
  };
};