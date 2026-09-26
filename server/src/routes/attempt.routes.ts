import { Router } from 'express';
import { AttemptController } from '../controllers/AttemptController.js';
import { extractLearnerId } from '../middleware/learnerId.js';

export function createAttemptRoutes(attemptController: AttemptController): Router {
  const router = Router();

  // Apply learner extraction middleware to all attempt routes
  router.use(extractLearnerId);

  // Get attempt details
  router.get('/:id', attemptController.getAttempt);

  // Auto-save / update draft submission
  router.put('/:id/draft', attemptController.saveDraft);

  // Submit attempt for evaluation
  router.post('/:id/submit', attemptController.submitAttempt);

  // Poll attempt evaluation status
  router.get('/:id/status', attemptController.getAttemptStatus);

  // Get detailed evaluation report
  router.get('/:id/evaluation', attemptController.getEvaluation);

  // Retry failed evaluation
  router.post('/:id/retry', attemptController.retryEvaluation);

  return router;
}
