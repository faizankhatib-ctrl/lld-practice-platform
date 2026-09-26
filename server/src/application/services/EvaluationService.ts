import { IAttemptRepository, IProblemRepository, IEvaluationRepository } from '../../domain/interfaces/IRepositories.js';
import { IEvaluator } from '../../domain/interfaces/IEvaluator.js';
import { Evaluation } from '../../domain/entities/Evaluation.js';
import { ScoreCard } from '../../domain/entities/ScoreCard.js';
import { CriterionResult, RubricCriterion } from '../../domain/types/common.types.js';
import { MockEvaluator } from '../evaluators/MockEvaluator.js';
import { AppError } from '../../middleware/errorHandler.js';

export class EvaluationService {
  private inFlightEvaluations: Set<string> = new Set();

  constructor(
    private readonly attemptRepository: IAttemptRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly evaluator: IEvaluator = new MockEvaluator()
  ) {}

  public async evaluateAttempt(attemptId: string): Promise<Evaluation | null> {
    // Prevent duplicate concurrent evaluation jobs for the same attempt
    if (this.inFlightEvaluations.has(attemptId)) {
      console.log(`[EvaluationService] Attempt ${attemptId} is already being evaluated. Skipping duplicate trigger.`);
      return null;
    }

    this.inFlightEvaluations.add(attemptId);

    try {
      const attempt = await this.attemptRepository.findById(attemptId);
      if (!attempt) {
        throw new AppError(`Attempt not found with ID '${attemptId}'`, 404, 'NOT_FOUND');
      }

      // If attempt is already EVALUATED, return the existing evaluation
      if (attempt.status === 'EVALUATED' && attempt.evaluationId) {
        return this.evaluationRepository.findById(attempt.evaluationId);
      }

      // Transition to EVALUATING if it was SUBMITTED
      if (attempt.status === 'SUBMITTED') {
        attempt.startEvaluation();
        await this.attemptRepository.save(attempt);
      } else if (attempt.status !== 'EVALUATING') {
        throw new AppError(
          `Cannot evaluate attempt in status '${attempt.status}'. Must be 'SUBMITTED' or 'EVALUATING'.`,
          409,
          'INVALID_STATE_TRANSITION'
        );
      }

      // Load problem (support ID or slug)
      let problem = await this.problemRepository.findById(attempt.problemId);
      if (!problem) {
        problem = await this.problemRepository.findBySlug(attempt.problemId);
      }
      if (!problem) {
        throw new AppError(`Associated problem '${attempt.problemId}' not found`, 404, 'NOT_FOUND');
      }

      // Execute evaluation via IEvaluator
      const evalResult = await this.evaluator.evaluate(problem, attempt.submission);

      // Map NormalizedCriterionEvaluation to domain CriterionResult
      const criteriaResults: CriterionResult[] = evalResult.criteriaScores.map((c) => ({
        criterion: c.criterion as RubricCriterion,
        score: c.score,
        maxScore: c.maxScore,
        evidence: c.evidence,
        concern: c.concern,
        suggestion: c.suggestion,
        confidence: c.confidence,
      }));

      const scoreCard = new ScoreCard(criteriaResults);
      const evalId = `eval-${attempt.id}-${Date.now()}`;

      const evaluation = new Evaluation({
        id: evalId,
        attemptId: attempt.id,
        problemId: problem.id,
        scoreCard,
        summary: evalResult.summary,
        strengths: evalResult.strengths,
        weaknesses: evalResult.weaknesses,
      });

      // Save Evaluation aggregate
      await this.evaluationRepository.save(evaluation);

      // Complete Attempt transition to EVALUATED
      attempt.completeEvaluation(evaluation.id);
      await this.attemptRepository.save(attempt);

      return evaluation;
    } catch (error: any) {
      console.error(`[EvaluationService] Error evaluating attempt ${attemptId}:`, error);

      // Attempt recovery: transition to FAILED and persist error message
      try {
        const attempt = await this.attemptRepository.findById(attemptId);
        if (attempt && attempt.status === 'EVALUATING') {
          const safeMessage = error.message && !error.message.includes('stack')
            ? error.message
            : 'Evaluation failed due to an internal processing error';
          attempt.failEvaluation(safeMessage);
          await this.attemptRepository.save(attempt);
        }
      } catch (saveError) {
        console.error(`[EvaluationService] Failed to persist FAILED status for attempt ${attemptId}:`, saveError);
      }

      throw error;
    } finally {
      this.inFlightEvaluations.delete(attemptId);
    }
  }

  public getEvaluator(): IEvaluator {
    return this.evaluator;
  }
}
