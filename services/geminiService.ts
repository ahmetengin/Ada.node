
import { GoogleGenAI, Type } from "@google/genai";
import { VotableResponse } from "../types";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        if (!API_KEY) {
            throw new Error("Gemini API key is not set. Please set the API_KEY environment variable.");
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

const executeRequest = async <T>(requestFn: () => Promise<T>, functionName: string): Promise<T | string> => {
    if (!API_KEY) {
        return `[ERROR] Gemini API key not configured for ${functionName}.`;
    }

    const maxRetries = 5;
    let delay = 7000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error: any) {
            if (error.message.includes('429') || (error.httpStatus && error.httpStatus === 429)) {
                if (i === maxRetries - 1) {
                    console.error(`Max retries reached for rate limit error in ${functionName}.`, error);
                    return `[ERROR] API rate limit exceeded. Please wait a moment and try again.`;
                }
                console.warn(`Rate limit hit on ${functionName}. Retrying in ${delay}ms...`);
                await sleep(delay);
                delay *= 1.5; // Less aggressive backoff
            } else {
                console.error(`Error in ${functionName} with Gemini:`, error);
                return `[ERROR] An unexpected error occurred while generating content.`;
            }
        }
    }
    return `[ERROR] Failed in ${functionName} after all retries.`;
}

export const generateContent = async (prompt: string): Promise<string> => {
    const result = await executeRequest(async () => {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7, topP: 0.9 }
        });
        return response.text;
    }, 'generateContent');
    return typeof result === 'string' ? result : '';
};

export const generateAnalyticContent = async (prompt: string, model: 'gemini-2.5-flash' | 'gemini-3-pro-preview'): Promise<string> => {
    const result = await executeRequest(async () => {
         const client = getAiClient();
        const response = await client.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: model === 'gemini-3-pro-preview' ? 0.4 : 0.8,
            }
        });
        return response.text.trim();
    }, 'generateAnalyticContent');
    return typeof result === 'string' ? result : '';
}

export const generateVotableContent = async (prompt: string): Promise<VotableResponse | null> => {
    const result = await executeRequest(async () => {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.8,
                responseMimeType: "application/json",
                responseSchema: decisionSchema,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as VotableResponse;
    }, 'generateVotableContent');
    
    return typeof result === 'object' && result !== null ? result as VotableResponse : null;
};
