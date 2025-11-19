
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
                delay *= 1.5;
            } else {
                console.error(`Error in ${functionName} with Gemini:`, error);
                return `[ERROR] An unexpected error occurred while generating content.`;
            }
        }
    }
    return `[ERROR] Failed in ${functionName} after all retries.`;
}

// Estimate token count based on characters (rough approximation for visualization)
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export const generateContent = async (prompt: string): Promise<{text: string, tokens: number}> => {
    const result = await executeRequest(async () => {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7, topP: 0.9 }
        });
        return response.text;
    }, 'generateContent');
    
    const text = typeof result === 'string' ? result : '';
    return { text, tokens: estimateTokens(prompt) + estimateTokens(text) };
};

export const generateAnalyticContent = async (prompt: string, model: 'gemini-2.5-flash' | 'gemini-3-pro-preview'): Promise<{text: string, tokens: number}> => {
    const result = await executeRequest(async () => {
         const client = getAiClient();
        const response = await client.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: model === 'gemini-3-pro-preview' ? 0.4 : 0.8,
            }
        });
        return response.text?.trim() || '';
    }, 'generateAnalyticContent');
    
    const text = typeof result === 'string' ? result : '';
    return { text, tokens: estimateTokens(prompt) + estimateTokens(text) };
}

export const generateVotableContent = async (prompt: string): Promise<{response: VotableResponse | null, tokens: number}> => {
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

        const jsonString = response.text?.trim() || '{}';
        return JSON.parse(jsonString) as VotableResponse;
    }, 'generateVotableContent');
    
    const response = typeof result === 'object' && result !== null ? result as VotableResponse : null;
    return { response, tokens: estimateTokens(prompt) + 200 }; // Flat +200 for JSON overhead
};
