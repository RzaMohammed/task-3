import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import healthRoutes from './routes/health.routes';
import searchRoutes from './routes/search.routes';
import matchingRoutes from './routes/matching.routes';
import evidenceRoutes from './routes/evidence.routes';
import blockchainRoutes from './routes/blockchain.routes';
import { config } from './config';
import { AppError } from './utils/errors';

const app = express();
const port = config.BACKEND_PORT || 5000;

// Security & Middleware
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Global Multer & Error Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'Uploaded image file size exceeds the allowed limit (10MB).'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IMAGE',
        message: `Upload error: ${err.message}`
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred.'
    }
  });
});

// Start listener (only in non-test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log(`Visual search: http://localhost:${port}/api/search/image`);
    console.log(`Matching: http://localhost:${port}/api/matching/run`);
    console.log(`Evidence: http://localhost:${port}/api/evidence/create`);
    console.log(`Blockchain: http://localhost:${port}/api/blockchain/health`);
  });
}

export default app;
