import { Router } from 'express';
import { ProblemController } from '../controllers/ProblemController.js';
import { AttemptController } from '../controllers/AttemptController.js';
import { extractLearnerId } from '../middleware/learnerId.js';

export function createProblemRoutes(
  problemController: ProblemController,
  attemptController: AttemptController
): Router {
  const router = Router();

  // Apply learner extraction middleware to all problem routes
  router.use(extractLearnerId);

  // List all problems
  router.get('/', problemController.listProblems);

  // Get problem by ID or slug
  router.get('/:idOrSlug', problemController.getProblemByIdOrSlug);

  // Create an attempt for a problem
  router.post('/:id/attempts', attemptController.createAttempt);

  // Get attempt history for a problem (current learner only)
  router.get('/:id/attempts', problemController.getProblemAttempts);

  return router;
}
