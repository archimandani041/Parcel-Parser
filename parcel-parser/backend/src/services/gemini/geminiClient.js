import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized Gemini API Client Config.
 * Never exposes the API key to client-side frontend code.
 */

// Model specified in environment variable, configurable through .env
export const getGeminiModelName = () => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
};

// Fallback models in case the configured model is unavailable
export const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

let aiInstance = null;

export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key-from-google-ai-studio') {
    console.warn('[Gemini Client] Warning: GEMINI_API_KEY is not set or using placeholder. API requests will fail if key is required.');
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  return aiInstance;
};
