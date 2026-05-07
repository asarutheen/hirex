import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { uploadResume } from './resume.controller';

const router: Router = Router();

// Store file in memory buffer — we stream directly to MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

router.post('/upload', authenticate, upload.single('resume'), uploadResume);

export default router;