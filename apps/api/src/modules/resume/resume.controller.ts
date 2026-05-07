import { Response } from 'express';
import { minioClient, MINIO_BUCKET } from '../../lib/minio';
import { generateEmbedding, parseResumePDF } from '../../lib/gemini'; 
import { prisma } from '@hirex/db';
import { AuthRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const uploadResume = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const userId = req.user!.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileKey = `resumes/${userId}/${uuidv4()}.pdf`;

    // Step 1 — Upload to MinIO
    await minioClient.putObject(
      MINIO_BUCKET,
      fileKey,
      file.buffer,
      file.size,
      { 'Content-Type': 'application/pdf' }
    );

  // Step 2 — Parse PDF with Gemini
    let parsedText = '';
    try {
      parsedText = await parseResumePDF(file.buffer);
      console.log('Parsed text length:', parsedText.length);
      console.log('Parsed text preview:', parsedText.substring(0, 100));
    } catch (parseError) {
      console.error('PDF parsing failed:', parseError);
    }

    // Step 3 — Save to DB
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileKey,
        fileUrl: `http://minio-svc:9000/${MINIO_BUCKET}/${fileKey}`,
        parsedText: parsedText || null,
      },
      select: {
        id: true,
        userId: true,
        fileName: true,
        fileKey: true,
        fileUrl: true,
        parsedText: true,
        createdAt: true,
        updatedAt: true,
        // embedding excluded — vector type can't be deserialized by Prisma
      }
    });

    console.log('Resume saved to DB:', resume.id);

    // Step 4 — Generate embedding from parsed text
    if (parsedText) {
      try {
        const embedding = await generateEmbedding(parsedText);
        await prisma.$executeRawUnsafe(
          `UPDATE "Resume" SET embedding = $1::vector WHERE id = $2`,
          JSON.stringify(embedding),
          resume.id
        );
        console.log('Resume embedding generated and stored');
      } catch (embeddingError) {
        console.error('Embedding generation failed:', embeddingError);
        // Don't fail — resume is already saved, embedding can be retried
      }
    }

    console.log('Sending response...');
    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileKey: resume.fileKey,
        parsedText: parsedText ? 'Extracted successfully' : 'Parsing pending',
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
};