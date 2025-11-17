

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateContent = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return `[Gemini API key not configured] Fallback: ${prompt}`;
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        // FIX: Simplified `contents` for a single text prompt.
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 0.9,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return `Error generating content. Please check the console. Fallback: ${prompt}`;
  }
};
