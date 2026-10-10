import { Router } from "express";
import { z } from "zod";
import { AIService } from "../services/ai.service.js";

export const quizRouter = Router();

const generateQuizSchema = z.object({
  subject: z.string().default("Pharmacology"),
  topic: z.string().default("Cardiac Drugs"),
  difficulty: z.enum(["Foundation", "Board-level", "Hard NGN"]).default("Board-level"),
  count: z.number().int().min(1).max(20).default(3),
  sourceText: z.string().optional(),
});

quizRouter.post("/generate", async (req, res) => {
  try {
    const parseResult = generateQuizSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: parseResult.error.errors,
      });
    }

    const { subject, topic, difficulty, count, sourceText } = parseResult.data;
    const questions = await AIService.generateQuestions({
      subject,
      topic,
      difficulty,
      count,
      sourceText,
    });

    return res.json({
      success: true,
      quiz: {
        id: `quiz-${Date.now()}`,
        subject,
        topic,
        difficulty,
        count: questions.length,
        questions,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
