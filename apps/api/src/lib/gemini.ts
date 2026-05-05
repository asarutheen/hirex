import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: text,
  });

  const values = response.embeddings?.[0]?.values;

  if (!values) {
    throw new Error('No embedding returned from Gemini');
  }

  return values;
};