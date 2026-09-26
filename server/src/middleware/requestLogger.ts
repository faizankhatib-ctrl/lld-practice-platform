import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '⚠️' : '✅';
    console.log(`${statusEmoji} [${method}] ${originalUrl} -> ${statusCode} (${duration}ms)`);
  });

  next();
}
