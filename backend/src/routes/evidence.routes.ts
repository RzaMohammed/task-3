import { Router } from 'express';
import { EvidenceController } from '../controllers/evidence.controller';

const router = Router();

// POST /api/evidence/create
router.post('/create', EvidenceController.createEvidence);

// POST /api/evidence/verify
router.post('/verify', EvidenceController.verifyEvidence);

// POST /api/evidence/bundle/export
router.post('/bundle/export', EvidenceController.exportBundle);

// POST /api/evidence/bundle/verify
router.post('/bundle/verify', EvidenceController.verifyBundle);

export default router;
