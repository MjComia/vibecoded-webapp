import express from "express";
import cors from "cors";
import { config, validateEnv } from "./config/env.js";
import { SRSService, CardRating } from "./services/srs.service.js";
import { taxonomyRouter } from "./routes/taxonomy.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { quizRouter } from "./routes/quiz.routes.js";
import { mockRouter } from "./routes/mock.routes.js";

const app = express();

app.use(cors({
  origin: [config.clientUrl, "http://localhost:5173", "http://localhost:8443", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json({ limit: "25mb" }));

// Routes
app.use("/api/taxonomy", taxonomyRouter);
app.use("/api/profile", profileRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/mock", mockRouter);

// Health Check & Diagnostics
app.get("/api/health", (_req, res) => {
  const { valid, warnings } = validateEnv();
  res.json({
    status: "ok",
    app: "Real Nurse Backend API",
    version: "1.0.0",
    environment: config.nodeEnv,
    time: new Date().toISOString(),
    configStatus: {
      hasGeminiKey: Boolean(config.geminiApiKey),
      hasSupabaseConfig: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      valid,
      warnings,
    },
  });
});

// SRS Flashcard Endpoint (Calculate dynamic intervals)
app.post("/api/srs/intervals", (req, res) => {
  try {
    const card = req.body?.card || SRSService.createInitialCard();
    const intervals = SRSService.getNextIntervals(card);
    res.json({ success: true, intervals });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// SRS Flashcard Review Endpoint (Apply rating and return updated card)
app.post("/api/srs/review", (req, res) => {
  try {
    const { card, rating } = req.body as { card?: any; rating: CardRating };
    if (!rating || !["Again", "Hard", "Good", "Easy"].includes(rating)) {
      return res.status(400).json({ success: false, error: "Invalid rating. Must be Again, Hard, Good, or Easy." });
    }
    const currentCard = card || SRSService.createInitialCard();
    const result = SRSService.applyReview(currentCard, rating);
    const nextIntervals = SRSService.getNextIntervals(result.card);
    res.json({ success: true, updatedCard: result.card, log: result.log, nextIntervals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || "Internal server error",
    },
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`[Real Nurse API] Server running on port ${config.port} (${config.nodeEnv})`);
    const envCheck = validateEnv();
    if (envCheck.warnings.length > 0) {
      console.log("[Config Warnings]:", envCheck.warnings);
    }
  });
}

export default app;
