import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";

export const profileRouter = Router();

const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100).optional(),
  target_exam: z.enum(["NCLEX-RN", "NLE"]).optional(),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Exam date must be YYYY-MM-DD").optional(),
  daily_goal_minutes: z.number().int().min(10).max(480).optional(),
});

// Helper middleware to extract user from Supabase Bearer token
async function extractUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ success: false, error: "Invalid or expired session" });
  }

  req.user = user;
  next();
}

// GET /api/profile
profileRouter.get("/", extractUser, async (req: any, res: any) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    return res.json({ success: true, profile });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/profile
profileRouter.patch("/", extractUser, async (req: any, res: any) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: parseResult.error.errors,
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(parseResult.data)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, profile: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
