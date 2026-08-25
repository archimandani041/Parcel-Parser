import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized Gemini API Client Config.
 * Primary model: gemini-3.6-flash
 * Fallbacks: gemini-flash-latest, gemini-3.5-flash
 */

export const getGeminiModelName = () => {
  let model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  model = model.replace(/^models\//, '').trim();
  return model || 'gemini-3.6-flash';
};

export const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash'
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
