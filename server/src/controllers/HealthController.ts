import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export class HealthController {
  public static getHealth(req: Request, res: Response): void {
    // The exact response expected by the requirement
    res.status(200).json({
      status: 'ok',
    });
  }

  public static getDetailedHealth(req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
      },
      evaluator: env.EVALUATOR_TYPE,
    });
  }
}
