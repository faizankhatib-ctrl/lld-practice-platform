import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // 1. CORS Configuration
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-learner-id', 'X-Learner-Id'],
      exposedHeaders: ['x-learner-id', 'X-Learner-Id'],
    })
  );

  // 2. Request body parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 3. Request Logging (skip during testing to keep logs clean)
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // 4. API Routes
  app.use('/api/v1', apiRouter);

  // 5. 404 Not Found Handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
  });

  // 6. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
