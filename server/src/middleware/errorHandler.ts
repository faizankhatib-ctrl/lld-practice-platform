import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  DomainError,
  InvalidStateTransitionError,
  InvalidSubmissionError,
  InvalidArgumentError,
} from '../domain/errors/DomainErrors.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError | DomainError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const flat = err.flatten();
    const errorMessages = Object.entries(flat.fieldErrors)
      .map(([field, msgs]) => `${field}: ${(msgs || []).join(', ')}`)
      .concat(flat.formErrors)
      .filter(Boolean)
      .join('; ');

    res.status(400).json({
      success: false,
      status: 'fail',
      error: {
        code: 'VALIDATION_ERROR',
        message: errorMessages || 'Validation error in request payload',
      },
    });
    return;
  }

  // 2. Specific Domain Errors
  if (err instanceof InvalidStateTransitionError) {
    res.status(409).json({
      success: false,
      status: 'fail',
      error: {
        code: 'INVALID_STATE_TRANSITION',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof InvalidSubmissionError) {
    res.status(400).json({
      success: false,
      status: 'fail',
      error: {
        code: 'INVALID_SUBMISSION',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof InvalidArgumentError) {
    res.status(400).json({
      success: false,
      status: 'fail',
      error: {
        code: 'INVALID_ARGUMENT',
        message: err.message,
      },
    });
    return;
  }

  // 3. Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: 'fail',
      error: {
        code: err.code || 'APP_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // 4. Default Unknown / Unexpected Errors (Never expose stack traces or Mongo internals)
  console.error('💥 Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    status: 'error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred',
    },
  });
}
