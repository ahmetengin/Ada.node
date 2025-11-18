import { GoogleGenAI, Type } from "@google/genai";
import { VotableResponse } from "../types";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        if (!API_KEY) {
            console.error("Gemini API key is not set. Please set the API_KEY environment variable.");
            // Fallback or throw error, for now we let it fail in the constructor
        }
        ai = new GoogleGenAI({ apiKey: API_KEY! });
    }
    return ai;
}

const decisionSchema = {
    type: Type.OBJECT,
    properties: {
        decision: { type: Type.STRING },
        reason: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
    },
    required: ['decision', 'reason', 'confidence'],
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a simple text response from a prompt.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text content.
 */
export const generateContent = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return `[Gemini API key not configured] Fallback: ${prompt}`;
  }
  
  const maxRetries = 5;
  let delay = 7000; // Increased initial delay

  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = getAiClient();
      const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              temperature: 0.7,
              topP: 0.9,
          }
      });
      return response.text;
    } catch (error: any) {
        if (error.toString().includes('429') || (error.httpStatus && error.httpStatus === 429)) {
            if (i === maxRetries - 1) {
                console.error("Max retries reached for rate limit error.", error);
                return `[ERROR] API rate limit exceeded. Please wait a moment and try again.`;
            }
            console.warn(`Rate limit hit on generateContent. Retrying in ${delay}ms...`);
            await sleep(delay);
            delay *= 2; // Exponential backoff
        } else {
            console.error("Error generating content with Gemini:", error);
            return `[ERROR] An unexpected error occurred while generating content.`;
        }
    }
  }
  return `[ERROR] Failed to generate content after all retries.`;
};

/**
 * Generates a structured, votable response (decision, reason, confidence) from a prompt.
 * Enforces a JSON schema for reliable parsing.
 * @param prompt The detailed prompt for the decision-making task.
 * @returns A VotableResponse object or null if parsing fails.
 */
export const generateVotableContent = async (prompt: string): Promise<VotableResponse | null> => {
    if (!API_KEY) {
        console.warn("Gemini API key not configured.");
        return null;
    }
    
    const maxRetries = 5;
    let delay = 7000; // Increased initial delay

    for (let i = 0; i < maxRetries; i++) {
        try {
            const client = getAiClient();
            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.8, // Higher temp for more diverse reasoning in votes
                    responseMimeType: "application/json",
                    responseSchema: decisionSchema,
                }
            });

            const jsonString = response.text.trim();
            const parsed = JSON.parse(jsonString);
            
            if (typeof parsed.decision === 'string' && typeof parsed.reason === 'string' && typeof parsed.confidence === 'number') {
                return parsed as VotableResponse;
            }
            console.error("Failed to parse votable content after API call:", jsonString);
            return null; // Parsing error, don't retry

        } catch (error: any) {
             if (error.toString().includes('429') || (error.httpStatus && error.httpStatus === 429)) {
                if (i === maxRetries - 1) {
                    console.error("Max retries reached for rate limit error.", error);
                    break; // Exit loop and return null
                }
                console.warn(`Rate limit hit on generateVotableContent. Retrying in ${delay}ms...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
            } else {
                console.error("Error generating votable content:", error);
                break; // Exit loop for non-retryable errors (e.g., JSON parsing, etc.)
            }
        }
    }
    return null;
}