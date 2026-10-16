import { Router, Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";

export const analyticsRouter = Router();

// GET /api/analytics - Get comprehensive analytics summary
analyticsRouter.get("/", (req: Request, res: Response) => {
  try {
    const examParam = (req.query.exam as string) || "NLE";
    const userId = req.query.userId as string | undefined;
    const examType = examParam.toUpperCase().includes("NCLEX") ? "NCLEX-RN" : "NLE";
    const analytics = AnalyticsService.getAnalytics(examType, userId);
    res.json({ success: true, analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/weak-drill - Get weak drill recommendations
analyticsRouter.get("/weak-drill", (req: Request, res: Response) => {
  try {
    const examParam = (req.query.exam as string) || "NLE";
    const userId = req.query.userId as string | undefined;
    const examType = examParam.toUpperCase().includes("NCLEX") ? "NCLEX-RN" : "NLE";
    const analytics = AnalyticsService.getAnalytics(examType, userId);
    res.json({
      success: true,
      recommendation: analytics.weakDrillRecommendation,
      primaryWeakArea: analytics.primaryWeakArea,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/analytics/record - Record attempt (quiz/mock/flashcards)
analyticsRouter.post("/record", (req: Request, res: Response) => {
  try {
    const { type, subject, topic, score, total, userId } = req.body;
    if (!type || !subject || score === undefined || !total) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: type, subject, score, total",
      });
    }

    AnalyticsService.recordAttempt({
      type,
      subject,
      topic,
      score: Number(score),
      total: Number(total),
      userId,
    });

    const updated = AnalyticsService.getAnalytics(undefined, userId);
    res.json({ success: true, updatedAnalytics: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/analytics/reset - Clear user study attempts
analyticsRouter.delete("/reset", (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId || req.body?.userId) as string | undefined;
    AnalyticsService.resetAnalytics(userId);
    res.json({ success: true, message: "User statistics reset to clean slate." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
