import { Router } from 'express';
import multer from 'multer';
import { PipelineController } from '../controllers/pipeline.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// POST /api/pipeline/run
router.post('/run', upload.single('image'), PipelineController.runPipeline);

export default router;
