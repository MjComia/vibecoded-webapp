import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./env.js";

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!config.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    genAIInstance = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAIInstance;
}

// Default recommended model for clinical reasoning & fast structured JSON generation
export const GEMINI_MODEL = "gemini-3.5-flash-lite";
