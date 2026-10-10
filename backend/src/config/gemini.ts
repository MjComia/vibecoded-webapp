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

// Default recommended model for reasoning & structured JSON outputs
export const GEMINI_MODEL = "gemini-1.5-flash";
