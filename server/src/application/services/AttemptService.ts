import { IAttemptRepository, IProblemRepository, IEvaluationRepository } from '../../domain/interfaces/IRepositories.js';
import { Attempt } from '../../domain/entities/Attempt.js';
import { StructuredTextSubmission } from '../../domain/entities/StructuredTextSubmission.js';
import { StructuredTextSections } from '../../domain/types/common.types.js';
import { EvaluationService } from './EvaluationService.js';
import { AppError } from '../../middleware/errorHandler.js';
import { InvalidSubmissionError } from '../../domain/errors/DomainErrors.js';

export interface CreateAttemptResult {
  attemptId: string;
  attemptNumber: number;
  status: string;
  parentAttemptId: string | null;
}

export class AttemptService {
  constructor(
    private readonly attemptRepository: IAttemptRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly evaluationService: EvaluationService
  ) {}

  public async createAttempt(
    problemId: string,
    learnerId: string,
    parentAttemptId?: string
  ): Promise<CreateAttemptResult> {
    // 1. Verify problem exists (support either ID or slug)
    let problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      problem = await this.problemRepository.findBySlug(problemId);
    }
    if (!problem) {
      throw new AppError(`Problem not found with ID or slug '${problemId}'`, 404, 'NOT_FOUND');
    }

    // 2. Handle Fork flow if parentAttemptId is provided
    if (parentAttemptId) {
      const parentAttempt = await this.attemptRepository.findById(parentAttemptId);
      if (!parentAttempt) {
        throw new AppError(`Parent attempt not found with ID '${parentAttemptId}'`, 404, 'NOT_FOUND');
      }

      // Verify parent belongs to same learner
      if (parentAttempt.learnerId !== learnerId) {
        throw new AppError('Cannot fork an attempt belonging to another learner', 404, 'NOT_FOUND');
      }

      // Verify parent is EVALUATED
      if (parentAttempt.status !== 'EVALUATED') {
        throw new AppError(
          `Can only fork an evaluated attempt. Current status is '${parentAttempt.status}'`,
          409,
          'INVALID_STATE_TRANSITION'
        );
      }

      const newAttemptId = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const forkedAttempt = parentAttempt.fork(newAttemptId);

      await this.attemptRepository.save(forkedAttempt);

      return {
        attemptId: forkedAttempt.id,
        attemptNumber: forkedAttempt.attemptNumber,
        status: forkedAttempt.status,
        parentAttemptId: forkedAttempt.parentAttemptId,
      };
    }

    // 3. Normal create flow
    const attemptCount = await this.attemptRepository.countByProblemAndLearner(problemId, learnerId);
    const attemptNumber = attemptCount + 1;
    const attemptId = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const initialSubmission = StructuredTextSubmission.createEmpty(`${attemptId}_sub`);
    const newAttempt = new Attempt({
      id: attemptId,
      problemId: problem.id,
      learnerId,
      attemptNumber,
      submission: initialSubmission,
    });

    await this.attemptRepository.save(newAttempt);

    return {
      attemptId: newAttempt.id,
      attemptNumber: newAttempt.attemptNumber,
      status: newAttempt.status,
      parentAttemptId: null,
    };
  }

  public async getAttempt(id: string, learnerId: string): Promise<Attempt> {
    const attempt = await this.attemptRepository.findById(id);
    if (!attempt) {
      throw new AppError(`Attempt not found with ID '${id}'`, 404, 'NOT_FOUND');
    }

    // Verify ownership
    if (attempt.learnerId !== learnerId) {
      throw new AppError(`Attempt not found with ID '${id}'`, 404, 'NOT_FOUND');
    }

    return attempt;
  }

  public async saveDraft(
    id: string,
    learnerId: string,
    sections: Partial<StructuredTextSections>
  ): Promise<Attempt> {
    const attempt = await this.getAttempt(id, learnerId);

    if (attempt.status !== 'DRAFT') {
      throw new AppError(
        `Cannot edit attempt in '${attempt.status}' state. Only 'DRAFT' attempts can be modified.`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    const currentSections =
      attempt.submission instanceof StructuredTextSubmission
        ? attempt.submission.sections
        : {
            requirementsAndAssumptions: '',
            classesAndResponsibilities: '',
            interfacesAndRelationships: '',
            designExplanation: '',
            tradeoffs: '',
            edgeCases: '',
          };

    const updatedSections: StructuredTextSections = {
      requirementsAndAssumptions: sections.requirementsAndAssumptions !== undefined
        ? sections.requirementsAndAssumptions
        : currentSections.requirementsAndAssumptions,
      classesAndResponsibilities: sections.classesAndResponsibilities !== undefined
        ? sections.classesAndResponsibilities
        : currentSections.classesAndResponsibilities,
      interfacesAndRelationships: sections.interfacesAndRelationships !== undefined
        ? sections.interfacesAndRelationships
        : currentSections.interfacesAndRelationships,
      designExplanation: sections.designExplanation !== undefined
        ? sections.designExplanation
        : currentSections.designExplanation,
      tradeoffs: sections.tradeoffs !== undefined
        ? sections.tradeoffs
        : currentSections.tradeoffs,
      edgeCases: sections.edgeCases !== undefined
        ? sections.edgeCases
        : currentSections.edgeCases,
    };

    const updatedSubmission = new StructuredTextSubmission(`${attempt.id}_sub`, updatedSections);
    attempt.saveDraft(updatedSubmission);

    await this.attemptRepository.save(attempt);
    return attempt;
  }

  public async submitAttempt(
    id: string,
    learnerId: string,
    sections?: StructuredTextSections
  ): Promise<{ attemptId: string; status: string }> {
    const attempt = await this.getAttempt(id, learnerId);

    if (attempt.status !== 'DRAFT') {
      throw new AppError(
        `Cannot submit attempt in '${attempt.status}' state. Only 'DRAFT' attempts can be submitted.`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    // If new sections are provided in the submit request, update draft first
    if (sections) {
      const submission = new StructuredTextSubmission(`${attempt.id}_sub`, sections);
      attempt.saveDraft(submission);
    }

    // Validate submission completeness (domain check)
    const validation = attempt.submission.validate();
    if (!validation.isValid) {
      throw new AppError(
        `Submission incomplete: ${validation.errors.join('; ')}`,
        400,
        'INVALID_SUBMISSION'
      );
    }

    // Transition state from DRAFT -> SUBMITTED
    attempt.submit();

    // CRITICAL: Persist the submission BEFORE starting evaluation
    await this.attemptRepository.save(attempt);

    // Asynchronously trigger evaluation
    this.evaluationService.evaluateAttempt(attempt.id).catch((err) => {
      console.error(`[AttemptService] Asynchronous evaluation failed for attempt ${attempt.id}:`, err);
    });

    return {
      attemptId: attempt.id,
      status: attempt.status,
    };
  }

  public async getAttemptStatus(
    id: string,
    learnerId: string
  ): Promise<{ attemptId: string; status: string; errorMessage: string | null }> {
    const attempt = await this.getAttempt(id, learnerId);
    return {
      attemptId: attempt.id,
      status: attempt.status,
      errorMessage: attempt.errorMessage,
    };
  }

  public async getEvaluation(id: string, learnerId: string): Promise<any> {
    const attempt = await this.getAttempt(id, learnerId);

    if (attempt.status === 'DRAFT' || attempt.status === 'SUBMITTED' || attempt.status === 'EVALUATING') {
      return {
        status: attempt.status,
        inProgress: true,
        message: 'Evaluation is in progress. Please check status endpoint.',
      };
    }

    if (attempt.status === 'FAILED') {
      return {
        status: 'FAILED',
        error: {
          code: 'EVALUATION_FAILED',
          message: attempt.errorMessage || 'Evaluation failed. You can retry evaluation.',
        },
      };
    }

    if (!attempt.evaluationId) {
      throw new AppError('Evaluation record not linked to evaluated attempt', 500, 'INTERNAL_SERVER_ERROR');
    }

    const evaluation = await this.evaluationRepository.findById(attempt.evaluationId);
    if (!evaluation) {
      throw new AppError(`Evaluation record '${attempt.evaluationId}' not found`, 404, 'NOT_FOUND');
    }

    return {
      status: 'EVALUATED',
      overallScore: evaluation.getOverallScore(),
      passed: evaluation.isPassing(),
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      criteriaScores: evaluation.scoreCard.getAllCriteria().map((c) => ({
        criterion: c.criterion,
        score: c.score,
        maxScore: c.maxScore,
        evidence: c.evidence,
        concern: c.concern,
        suggestion: c.suggestion,
        confidence: c.confidence,
      })),
      createdAt: evaluation.createdAt,
    };
  }

  public async getAttemptHistory(
    problemId: string,
    learnerId: string
  ): Promise<any[]> {
    // Verify problem exists (support ID or slug)
    let problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      problem = await this.problemRepository.findBySlug(problemId);
    }
    if (!problem) {
      throw new AppError(`Problem not found with ID or slug '${problemId}'`, 404, 'NOT_FOUND');
    }

    const attempts = await this.attemptRepository.findByProblemAndLearner(problem.id, learnerId);

    // Map attempts and fetch evaluation scores for evaluated ones
    const historyPromises = attempts.map(async (att) => {
      let evaluationSummary = null;
      let overallScore = null;

      if (att.status === 'EVALUATED' && att.evaluationId) {
        const evaluation = await this.evaluationRepository.findById(att.evaluationId);
        if (evaluation) {
          evaluationSummary = evaluation.summary;
          overallScore = evaluation.getOverallScore();
        }
      }

      return {
        attemptId: att.id,
        attemptNumber: att.attemptNumber,
        parentAttemptId: att.parentAttemptId,
        status: att.status,
        overallScore,
        evaluationSummary,
        submittedAt: att.submittedAt,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      };
    });

    const history = await Promise.all(historyPromises);

    // Sort newest first by attemptNumber descending
    return history.sort((a, b) => b.attemptNumber - a.attemptNumber);
  }

  public async retryEvaluation(
    id: string,
    learnerId: string
  ): Promise<{ attemptId: string; status: string }> {
    const attempt = await this.getAttempt(id, learnerId);

    if (attempt.status !== 'FAILED') {
      throw new AppError(
        `Cannot retry evaluation for attempt in status '${attempt.status}'. Only 'FAILED' attempts can be retried.`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    // Transition from FAILED back to EVALUATING
    attempt.retryEvaluation();
    await this.attemptRepository.save(attempt);

    // Trigger evaluation asynchronously
    this.evaluationService.evaluateAttempt(attempt.id).catch((err) => {
      console.error(`[AttemptService] Retry evaluation failed for attempt ${attempt.id}:`, err);
    });

    return {
      attemptId: attempt.id,
      status: attempt.status,
    };
  }
}
