import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Look for .env in current directory, parent (vibecoded-webapp), and root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
};

export function validateEnv() {
  const warnings: string[] = [];
  if (!config.geminiApiKey) {
    warnings.push("GEMINI_API_KEY is not set. AI generation features will require this key.");
  }
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    warnings.push("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Database operations will require Supabase credentials.");
  }
  return { valid: warnings.length === 0, warnings };
}
