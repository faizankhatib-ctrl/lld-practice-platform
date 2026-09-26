import { Request, Response, NextFunction } from 'express';
import { AttemptService } from '../application/services/AttemptService.js';
import { StructuredTextSubmission } from '../domain/entities/StructuredTextSubmission.js';
import { CreateAttemptSchema, SaveDraftSchema, SubmitAttemptSchema } from '../dto/attempt.dto.js';

export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  public createAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const problemId = req.params.id as string;
      const parsed = CreateAttemptSchema.parse(req.body || {});
      const result = await this.attemptService.createAttempt(
        problemId,
        req.learnerId,
        parsed.parentAttemptId
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const attempt = await this.attemptService.getAttempt(id, req.learnerId);

      const submissionData =
        attempt.submission instanceof StructuredTextSubmission
          ? {
              id: attempt.submission.id,
              format: attempt.submission.format,
              sections: attempt.submission.sections,
            }
          : {
              id: attempt.submission.id,
              format: attempt.submission.format,
            };

      res.status(200).json({
        success: true,
        data: {
          id: attempt.id,
          problemId: attempt.problemId,
          learnerId: attempt.learnerId,
          attemptNumber: attempt.attemptNumber,
          parentAttemptId: attempt.parentAttemptId,
          status: attempt.status,
          submission: submissionData,
          submittedAt: attempt.submittedAt,
          errorMessage: attempt.errorMessage,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public saveDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parsed = SaveDraftSchema.parse(req.body);
      const attempt = await this.attemptService.saveDraft(id, req.learnerId, parsed);

      res.status(200).json({
        success: true,
        data: {
          id: attempt.id,
          status: attempt.status,
          updatedAt: attempt.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public submitAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      let sections;
      if (req.body && Object.keys(req.body).length > 0) {
        sections = SubmitAttemptSchema.parse(req.body);
      }

      const result = await this.attemptService.submitAttempt(id, req.learnerId, sections);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAttemptStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.attemptService.getAttemptStatus(id, req.learnerId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getEvaluation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.attemptService.getEvaluation(id, req.learnerId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public retryEvaluation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.attemptService.retryEvaluation(id, req.learnerId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
