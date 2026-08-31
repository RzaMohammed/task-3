import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// GET /api/health
router.get('/health', HealthController.check);

export default router;
