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

export const parseResumePDF = async (pdfBuffer: Buffer): Promise<string> => {
  const base64PDF = pdfBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64PDF,
            },
          },
          {
            text: `Extract all text content from this resume PDF. 
            Return the extracted text in a clean, structured format preserving sections like:
            - Personal Information
            - Summary/Objective
            - Work Experience
            - Education
            - Skills
            - Certifications
            Return only the extracted text, no additional commentary.`,
          },
        ],
      },
    ],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No text extracted from PDF');
  }

  return text;
};