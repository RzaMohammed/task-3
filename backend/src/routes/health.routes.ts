import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// GET /api/health
router.get('/health', HealthController.check);

// GET /api/health/deep — checks AI service + Solana RPC liveness
router.get('/health/deep', HealthController.deepCheck);

export default router;
