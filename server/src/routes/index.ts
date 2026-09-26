import { Router } from 'express';
import healthRoutes from './health.routes.js';
import { createProblemRoutes } from './problem.routes.js';
import { createAttemptRoutes } from './attempt.routes.js';
import { ProblemRepository } from '../repositories/ProblemRepository.js';
import { AttemptRepository } from '../repositories/AttemptRepository.js';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { createEvaluator } from '../application/evaluators/evaluatorFactory.js';
import { ProblemService } from '../application/services/ProblemService.js';
import { EvaluationService } from '../application/services/EvaluationService.js';
import { AttemptService } from '../application/services/AttemptService.js';
import { ProblemController } from '../controllers/ProblemController.js';
import { AttemptController } from '../controllers/AttemptController.js';

// Instantiate Repositories
const problemRepository = new ProblemRepository();
const attemptRepository = new AttemptRepository();
const evaluationRepository = new EvaluationRepository();

// Instantiate Evaluator & Application Services
const evaluator = createEvaluator();
const evaluationService = new EvaluationService(
  attemptRepository,
  problemRepository,
  evaluationRepository,
  evaluator
);
const problemService = new ProblemService(problemRepository);
const attemptService = new AttemptService(
  attemptRepository,
  problemRepository,
  evaluationRepository,
  evaluationService
);

// Instantiate Controllers
const problemController = new ProblemController(problemService, attemptService);
const attemptController = new AttemptController(attemptService);

const router = Router();

// Liveness & Readiness Routes: /api/v1/health
router.use('/health', healthRoutes);

// Problem Routes: /api/v1/problems
router.use('/problems', createProblemRoutes(problemController, attemptController));

// Attempt Routes: /api/v1/attempts
router.use('/attempts', createAttemptRoutes(attemptController));

export default router;
