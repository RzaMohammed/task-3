import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes';
import { config } from './config';

const app = express();
const port = config.BACKEND_PORT || 5000;

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Register API Routes
app.use('/api', healthRoutes);

// Start server listener
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/api/health`);
});

export default app;
