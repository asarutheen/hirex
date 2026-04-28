import { Request, Response } from 'express';
import { prisma } from '@hirex/db';
import { AuthRequest } from '../../middleware/auth';

// POST /jobs — EMPLOYER only
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'EMPLOYER') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const { title, description, location, salary } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        salary,
        postedById: req.user.userId,
      },
    });

    res.status(201).json(job);
  } catch (err) {
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