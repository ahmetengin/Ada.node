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

/**
 * Generates a simple text response from a prompt.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text content.
 */
export const generateContent = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return `[Gemini API key not configured] Fallback: ${prompt}`;
  }
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
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return `Error generating content. Fallback: ${prompt}`;
  }
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
        return null;

    } catch (error) {
        console.error("Error generating votable content:", error);
        return null;
    }
}