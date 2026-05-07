import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

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
  // Try Gemini first — better understanding of resume structure
  try {
    const base64PDF = pdfBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
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
    if (text) return text;
  } catch (geminiError: any) {
    // If Gemini quota exhausted or fails, fall back to pdf-parse
    console.warn('Gemini PDF parsing failed, falling back to pdf-parse:', geminiError?.message);
  }

  // Fallback — pdf-parse, local, no API call, no quota
  const parser = new PDFParse({ data: pdfBuffer });
  const parsed = await parser.getText();
  if (!parsed.text) {
    throw new Error('Failed to extract text from PDF');
  }

  // Remove null bytes and non-UTF8 characters that PostgreSQL rejects
  const sanitized = parsed.text
    .replace(/\0/g, '')           // remove null bytes
    .replace(/[^\x09\x0A\x0D\x20-\x7E\x80-\xFF]/g, ' ')  // remove non-printable chars
    .trim();

  return sanitized;
};