import { Router } from "express";
import { z } from "zod";
import { SEED_QUESTION_BANK, AIService, type QuestionItem } from "../services/ai.service.js";

export const mockRouter = Router();

interface MockSession {
  attemptId: string;
  examType: "NCLEX-RN" | "NLE";
  durationMinutes: number;
  startedAt: number;
  expiresAt: number;
  status: "in_progress" | "submitted" | "expired";
  questions: QuestionItem[];
  userAnswers: Record<string, number>;
  flaggedQuestionIds: string[];
}

// In-memory sessions store (mirrored with Supabase mock_attempts)
const activeSessions = new Map<string, MockSession>();

const startMockSchema = z.object({
  examType: z.enum(["NCLEX-RN", "NLE"]).default("NCLEX-RN"),
  durationMinutes: z.number().int().min(1).max(300).default(15),
  itemCount: z.number().int().min(3).max(100).default(6),
  sourceText: z.string().optional(),
});

// POST /api/mock/start
mockRouter.post("/start", async (req, res) => {
  try {
    const parse = startMockSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: "Validation error", details: parse.error.errors });
    }

    const { examType, durationMinutes, itemCount, sourceText } = parse.data;
    const attemptId = `mock-${Date.now()}`;
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    let examQuestions: QuestionItem[] = [];

    if (sourceText && sourceText.trim().length > 100) {
      // Generate directly from student's uploaded notes
      examQuestions = await AIService.generateQuestions({
        subject: examType === "NLE" ? "NLE Comprehensive" : "NCLEX Comprehensive",
        topic: "Clinical Care",
        difficulty: "Board-level",
        count: Math.min(itemCount, 10),
        sourceText,
      });
    }

    if (examQuestions.length < itemCount) {
      // Supplement with board exam seed bank
      const needed = itemCount - examQuestions.length;
      const additional = SEED_QUESTION_BANK.slice(0, needed);
      examQuestions = [...examQuestions, ...additional];
    }

    const session: MockSession = {
      attemptId,
      examType,
      durationMinutes,
      startedAt: now,
      expiresAt,
      status: "in_progress",
      questions: examQuestions,
      userAnswers: {},
      flaggedQuestionIds: [],
    };

    activeSessions.set(attemptId, session);

    // Sanitize questions: NEVER leak correct answer or rationale to client during exam!
    const clientQuestions = examQuestions.map((q) => ({
      id: q.id,
      stem: q.stem,
      options: q.options,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    return res.json({
      success: true,
      attemptId,
      examType,
      durationMinutes,
      expiresAt,
      serverTime: now,
      questions: clientQuestions,
      allowBacktracking: examType === "NLE", // NLE allows reviewing flagged questions; NCLEX is linear
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mock/:attemptId/save-answer (Autosave endpoint)
mockRouter.post("/:attemptId/save-answer", (req, res) => {
  const { attemptId } = req.params;
  const { questionId, selectedOption, isFlagged } = req.body;

  const session = activeSessions.get(attemptId);
  if (!session) {
    return res.status(404).json({ success: false, error: "Mock session not found" });
  }

  if (session.status !== "in_progress") {
    return res.status(400).json({ success: false, error: "Exam is already submitted or closed" });
  }

  // Update answer
  if (selectedOption !== undefined) {
    session.userAnswers[questionId] = selectedOption;
  }

  // Update flag
  if (isFlagged !== undefined) {
    if (isFlagged && !session.flaggedQuestionIds.includes(questionId)) {
      session.flaggedQuestionIds.push(questionId);
    } else if (!isFlagged) {
      session.flaggedQuestionIds = session.flaggedQuestionIds.filter((id) => id !== questionId);
    }
  }

  return res.json({ success: true, savedAt: Date.now() });
});

// POST /api/mock/:attemptId/submit
mockRouter.post("/:attemptId/submit", (req, res) => {
  const { attemptId } = req.params;
  const session = activeSessions.get(attemptId);

  if (!session) {
    return res.status(404).json({ success: false, error: "Mock session not found" });
  }

  session.status = "submitted";

  let correctCount = 0;
  const breakdownBySubject: Record<string, { total: number; correct: number }> = {};

  const reviewItems = session.questions.map((q) => {
    const userSelected = session.userAnswers[q.id] ?? null;
    const isCorrect = userSelected === q.correct_answer_index;

    if (isCorrect) correctCount++;

    if (!breakdownBySubject[q.subject]) {
      breakdownBySubject[q.subject] = { total: 0, correct: 0 };
    }
    breakdownBySubject[q.subject].total++;
    if (isCorrect) breakdownBySubject[q.subject].correct++;

    return {
      id: q.id,
      stem: q.stem,
      options: q.options,
      userSelected,
      correctAnswerIndex: q.correct_answer_index,
      isCorrect,
      rationale: q.rationale,
      clinicalTip: q.clinical_tip,
      subject: q.subject,
      topic: q.topic,
      wasFlagged: session.flaggedQuestionIds.includes(q.id),
    };
  });

  const totalQuestions = session.questions.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercentage >= 75; // Standard board passing threshold

  return res.json({
    success: true,
    attemptId,
    examType: session.examType,
    scorePercentage,
    correctCount,
    totalQuestions,
    passed,
    breakdownBySubject,
    reviewItems,
    submittedAt: new Date().toISOString(),
  });
});
