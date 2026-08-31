import { Router } from 'express';
import { EvidenceController } from '../controllers/evidence.controller';

const router = Router();

// POST /api/evidence/create
router.post('/create', EvidenceController.createEvidence);

// POST /api/evidence/verify
router.post('/verify', EvidenceController.verifyEvidence);

export default router;
