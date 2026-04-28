import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  getMyApplications,
} from './jobs.controller';

const router: Router = Router();

// Public
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected
router.post('/', authenticate, createJob);
router.put('/:id', authenticate, updateJob);
router.delete('/:id', authenticate, deleteJob);
router.post('/:id/apply', authenticate, applyToJob);
router.get('/my/applications', authenticate, getMyApplications);

export default router;