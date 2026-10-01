import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized Gemini API Client Config.
 * Primary model: gemini-3.5-flash-lite (fastest, lowest latency ~1.5-3.5s)
 * Fallbacks: gemini-flash-lite-latest, gemini-3.1-flash-lite, gemini-3.6-flash, gemini-3.5-flash
 */

export const getGeminiModelName = () => {
  let model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  model = model.replace(/^models\//, '').trim();
  return model || 'gemini-3.5-flash-lite';
};

export const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

let aiInstance = null;

export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini-api-key')) {
    console.warn('[Gemini Client] Warning: GEMINI_API_KEY is not set or using placeholder.');
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  return aiInstance;
};
