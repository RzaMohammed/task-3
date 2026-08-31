import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// POST /api/search/image
router.post('/image', upload.single('image'), SearchController.searchImage);

export default router;
