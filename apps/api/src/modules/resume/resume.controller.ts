import { Request, Response } from 'express';
import multer from 'multer';
import { minioClient, MINIO_BUCKET } from '../../lib/minio';
import { prisma } from '@hirex/db';
import { v4 as uuidv4 } from 'uuid';

export const uploadResume = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const userId = (req as any).user.userId;
    const fileKey = `resumes/${userId}/${uuidv4()}.pdf`;

    // Upload to MinIO
    await minioClient.putObject(
      MINIO_BUCKET,
      fileKey,
      file.buffer,
      file.size,
      { 'Content-Type': 'application/pdf' }
    );

    // Save reference in DB
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileKey,
        fileUrl: `http://minio-svc:9000/${MINIO_BUCKET}/${fileKey}`,
      },
    });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileKey: resume.fileKey,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
};