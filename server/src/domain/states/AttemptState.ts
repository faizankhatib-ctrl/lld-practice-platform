import { EvaluationId } from '../types/common.types.js';
import { InvalidStateTransitionError, InvalidSubmissionError } from '../errors/DomainErrors.js';
import type { Attempt } from '../entities/Attempt.js';
import type { Submission } from '../entities/Submission.js';

export type AttemptStatus = 'DRAFT' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED' | 'FAILED';

export abstract class AttemptState {
  public abstract readonly status: AttemptStatus;

  public saveDraft(attempt: Attempt, content: Submission): void {
    throw new InvalidStateTransitionError(this.status, 'saveDraft');
  }

  public submit(attempt: Attempt): void {
    throw new InvalidStateTransitionError(this.status, 'submit');
  }

  public startEvaluation(attempt: Attempt): void {
    throw new InvalidStateTransitionError(this.status, 'startEvaluation');
  }

  public completeEvaluation(attempt: Attempt, evaluationId: EvaluationId): void {
    throw new InvalidStateTransitionError(this.status, 'completeEvaluation');
  }

  public failEvaluation(attempt: Attempt, reason: string): void {
    throw new InvalidStateTransitionError(this.status, 'failEvaluation');
  }

  public retryEvaluation(attempt: Attempt): void {
    throw new InvalidStateTransitionError(this.status, 'retryEvaluation');
  }
}

export class DraftState extends AttemptState {
  public readonly status: AttemptStatus = 'DRAFT';

  public override saveDraft(attempt: Attempt, content: Submission): void {
    attempt._setSubmission(content);
  }

  public override submit(attempt: Attempt): void {
    const validation = attempt.submission.validate();
    if (!validation.isValid) {
      throw new InvalidSubmissionError(
        'Cannot submit incomplete solution: ' + validation.errors.join('; '),
        validation.errors
      );
    }
    attempt._setSubmittedAt(new Date());
    attempt._transitionTo(new SubmittedState());
  }
}

export class SubmittedState extends AttemptState {
  public readonly status: AttemptStatus = 'SUBMITTED';

  public override startEvaluation(attempt: Attempt): void {
    attempt._clearError();
    attempt._transitionTo(new EvaluatingState());
  }
}

export class EvaluatingState extends AttemptState {
  public readonly status: AttemptStatus = 'EVALUATING';

  public override completeEvaluation(attempt: Attempt, evaluationId: EvaluationId): void {
    if (!evaluationId || evaluationId.trim().length === 0) {
      throw new Error('EvaluationId must be provided to complete evaluation');
    }
    attempt._setEvaluationId(evaluationId);
    attempt._clearError();
    attempt._transitionTo(new EvaluatedState());
  }

  public override failEvaluation(attempt: Attempt, reason: string): void {
    attempt._setErrorMessage(reason || 'Evaluation failed due to an unexpected error');
    attempt._transitionTo(new FailedState());
  }
}

export class FailedState extends AttemptState {
  public readonly status: AttemptStatus = 'FAILED';

  public override retryEvaluation(attempt: Attempt): void {
    attempt._clearError();
    attempt._transitionTo(new EvaluatingState());
  }
}

export class EvaluatedState extends AttemptState {
  public readonly status: AttemptStatus = 'EVALUATED';
  // Terminal state for this attempt: strictly read-only
}
