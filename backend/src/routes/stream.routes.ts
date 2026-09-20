import { Router } from 'express';
import { StreamController } from '../controllers/stream.controller';

const router = Router();

// GET /api/stream/pipeline/:pipelineId
router.get('/pipeline/:pipelineId', StreamController.streamPipelineEvents);

export default router;
