import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// GET /api/health
router.get('/health', HealthController.check);

// GET /api/health/deep — checks AI service + Solana RPC liveness
router.get('/health/deep', HealthController.deepCheck);

// GET /api/health/ready — readiness probe for container orchestration
router.get('/health/ready', HealthController.ready);

export default router;

