import { Response } from 'express';
import { groq, GROQ_MODEL } from '../../lib/groq';
import { AuthRequest } from '../../middleware/auth';

export const generateCoverLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobTitle, jobDescription, applicantBackground } = req.body;

    if (!jobTitle || !jobDescription || !applicantBackground) {
      res.status(400).json({
        error: 'jobTitle, jobDescription, and applicantBackground are required',
      });
      return;
    }

    const prompt = `You are a professional career coach. Write a compelling, personalized cover letter for the following job application.

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Applicant Background:
${applicantBackground}

Instructions:
- Keep it under 300 words
- Professional but not robotic
- Highlight specific skills from the applicant background that match the job
- Do not use generic filler phrases like "I am writing to express my interest"
- Return only the cover letter text, no extra commentary`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const coverLetter = completion.choices[0]?.message?.content;

    if (!coverLetter) {
      res.status(500).json({ error: 'No response from AI model' });
      return;
    }

    res.json({
      coverLetter,
      model: GROQ_MODEL,
      tokensUsed: completion.usage?.total_tokens,
    });
  } catch (error: any) {
    console.error('Groq error:', error?.message);
    res.status(500).json({ error: 'AI generation failed' });
  }
};