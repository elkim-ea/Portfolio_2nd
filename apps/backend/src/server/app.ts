import express from "express";
import cors from "cors";
import { correctKoreanText } from "../services/correctionService.js";
import { generateConversation } from "../services/conversationService.js";
import { runLevelTest } from "../services/levelTestService.js";

const DEV_USER_ID = "dev-user-001";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal server error";
}

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "koreanmate-backend",
      runtime: "container",
    });
  });

  app.post("/correction", async (req, res) => {
    try {
      const result = await correctKoreanText({
        text: req.body?.text,
        level: req.body?.level,
        explanationLanguage: req.body?.explanationLanguage,
        userId: DEV_USER_ID,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Correction route failed:", error);

      res.status(500).json({
        message: getErrorMessage(error),
      });
    }
  });

  app.post("/conversation", async (req, res) => {
    try {
      const result = await generateConversation({
        topic: req.body?.topic,
        level: req.body?.level,
        tone: req.body?.tone,
        userId: DEV_USER_ID,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Conversation route failed:", error);

      res.status(500).json({
        message: getErrorMessage(error),
      });
    }
  });

  app.post("/level-test", async (req, res) => {
    try {
      const result = await runLevelTest({
        text: req.body?.text,
        userId: DEV_USER_ID,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Level test route failed:", error);

      res.status(500).json({
        message: getErrorMessage(error),
      });
    }
  });

  return app;
};