import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';

const router = Router();

// POST /api/verification/verify
router.post('/verify', VerificationController.verifyEvidence);

export default router;
