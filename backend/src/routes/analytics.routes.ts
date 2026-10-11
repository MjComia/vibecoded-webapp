import { Router, Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";

export const analyticsRouter = Router();

// GET /api/analytics - Get comprehensive analytics summary
analyticsRouter.get("/", (req: Request, res: Response) => {
  try {
    const examParam = (req.query.exam as string) || "NLE";
    const examType = examParam.toUpperCase().includes("NCLEX") ? "NCLEX-RN" : "NLE";
    const analytics = AnalyticsService.getAnalytics(examType);
    res.json({ success: true, analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/weak-drill - Get weak drill recommendations
analyticsRouter.get("/weak-drill", (req: Request, res: Response) => {
  try {
    const examParam = (req.query.exam as string) || "NLE";
    const examType = examParam.toUpperCase().includes("NCLEX") ? "NCLEX-RN" : "NLE";
    const analytics = AnalyticsService.getAnalytics(examType);
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
    const { type, subject, topic, score, total } = req.body;
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
    });

    const updated = AnalyticsService.getAnalytics();
    res.json({ success: true, updatedAnalytics: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
