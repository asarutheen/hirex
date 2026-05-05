import { Request, Response } from 'express';
import { prisma } from '@hirex/db';
import { AuthRequest } from '../../middleware/auth';
import { generateEmbedding } from '../../lib/gemini';

// POST /jobs — EMPLOYER only
export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, location, salary } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        salary,
        postedById: req.user!.userId,
      },
    });

    // Generate embedding from title + description
    try {
      const embedding = await generateEmbedding(`${title} ${description}`);
      const vectorString = `[${embedding.join(',')}]`;

     await prisma.$executeRawUnsafe(
        `UPDATE "Job" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        job.id
      );
    } catch (embeddingError) {
      // Don't fail job creation if embedding fails
      console.error('Embedding generation failed:', embeddingError);
    }

    res.status(201).json(job);
  } catch (error: any) {
    console.error('Create job error:', error?.message);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

// GET /jobs — public
export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: {
          select: { id: true, email: true },
        },
      },
    });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// GET /jobs/:id — public
export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        postedBy: {
          select: { id: true, email: true },
        },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

// PUT /jobs/:id — EMPLOYER, owner only
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });

    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job.postedById !== req.user?.userId) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const { title, description, location, salary } = req.body;

    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: { title, description, location, salary },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
};

// DELETE /jobs/:id — EMPLOYER, owner only
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });

    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job.postedById !== req.user?.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await prisma.job.delete({ where: { id: req.params.id } });

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

// POST /jobs/:id/apply — APPLICANT only
export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'APPLICANT') {
      return res.status(403).json({ error: 'Only applicants can apply to jobs' });
    }

    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const application = await prisma.application.create({
      data: {
        applicantId: req.user!.userId,
        jobId: req.params.id as string,
      },
    });

    res.status(201).json(application);
  } catch (err: any) {
    // Prisma unique constraint = already applied
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }
    res.status(500).json({ error: 'Failed to apply to job' });
  }
};

// GET /applications — logged in user's own applications
export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { applicantId: req.user?.userId },
      include: {
        job: {
          select: { id: true, title: true, location: true, salary: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const semanticJobSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    // Generate embedding for the search query
    const embedding = await generateEmbedding(query);
    const vectorString = `[${embedding.join(',')}]`;

    // Find similar jobs using cosine distance
    const jobs = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, title, description, location, salary, "postedById", "createdAt",
        1 - (embedding <=> $1::vector) as similarity
       FROM "Job"
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 10`,
      vectorString
    );

    res.json({ jobs, query });
  } catch (error: any) {
    console.error('Semantic search error:', error?.message);
    res.status(500).json({ error: 'Semantic search failed' });
  }
};