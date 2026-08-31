import { Router } from 'express';
import { BlockchainController } from '../controllers/blockchain.controller';

const router = Router();

// GET /api/blockchain/health
router.get('/health', BlockchainController.getHealth);

// POST /api/blockchain/record
router.post('/record', BlockchainController.recordEvidence);

export default router;
