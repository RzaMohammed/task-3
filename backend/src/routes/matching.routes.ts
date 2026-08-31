import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';

const router = Router();

// POST /api/matching/run
router.post('/run', MatchingController.runMatching);

export default router;
