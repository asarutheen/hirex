import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { generateCoverLetter } from './ai.controller';

const router: Router = Router();

router.post('/cover-letter', authenticate, generateCoverLetter);

export default router;