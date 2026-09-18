import { GoogleGenerativeAI } from "@google/generative-ai";

export function gemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is missing");
  return new GoogleGenerativeAI(key);
}