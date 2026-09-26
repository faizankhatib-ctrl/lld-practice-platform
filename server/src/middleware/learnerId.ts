import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      learnerId: string;
    }
  }
}

export function extractLearnerId(req: Request, res: Response, next: NextFunction): void {
  const headerVal = req.header('x-learner-id');
  req.learnerId = headerVal && headerVal.trim().length > 0 ? headerVal.trim() : 'anonymous-demo-user';
  next();
}
