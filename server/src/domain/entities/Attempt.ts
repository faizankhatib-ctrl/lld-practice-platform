import {
  AttemptId,
  ProblemId,
  LearnerId,
  EvaluationId,
  SubmissionId,
} from '../types/common.types.js';
import { Submission } from './Submission.js';
import { StructuredTextSubmission } from './StructuredTextSubmission.js';
import {
  AttemptState,
  AttemptStatus,
  DraftState,
  SubmittedState,
  EvaluatingState,
  EvaluatedState,
  FailedState,
} from '../states/AttemptState.js';
import { InvalidArgumentError, InvalidStateTransitionError } from '../errors/DomainErrors.js';

export interface AttemptProps {
  id: AttemptId;
  problemId: ProblemId;
  learnerId: LearnerId;
  attemptNumber: number;
  submission: Submission;
  state?: AttemptState | AttemptStatus;
  evaluationId?: EvaluationId | null;
  parentAttemptId?: AttemptId | null;
  submittedAt?: Date | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Attempt {
  public readonly id: AttemptId;
  public readonly problemId: ProblemId;
  public readonly learnerId: LearnerId;
  public readonly attemptNumber: number;
  public readonly parentAttemptId: AttemptId | null;
  public readonly createdAt: Date;

  private _state: AttemptState;
  private _submission: Submission;
  private _evaluationId: EvaluationId | null;
  private _submittedAt: Date | null;
  private _errorMessage: string | null;
  private _updatedAt: Date;

  constructor(props: AttemptProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new InvalidArgumentError('Attempt ID cannot be empty');
    }
    if (!props.problemId || props.problemId.trim().length === 0) {
      throw new InvalidArgumentError('Problem ID cannot be empty');
    }
    if (!props.learnerId || props.learnerId.trim().length === 0) {
      throw new InvalidArgumentError('Learner ID cannot be empty');
    }
    if (!props.submission) {
      throw new InvalidArgumentError('Submission cannot be null or undefined');
    }
    if (props.attemptNumber < 1) {
      throw new InvalidArgumentError('Attempt number must be >= 1');
    }

    this.id = props.id;
    this.problemId = props.problemId;
    this.learnerId = props.learnerId;
    this.attemptNumber = props.attemptNumber;
    this.parentAttemptId = props.parentAttemptId || null;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this._submission = props.submission;
    this._evaluationId = props.evaluationId || null;
    this._submittedAt = props.submittedAt || null;
    this._errorMessage = props.errorMessage || null;

    // Initialize State
    if (!props.state || props.state === 'DRAFT' || props.state instanceof DraftState) {
      this._state = new DraftState();
    } else if (props.state === 'SUBMITTED' || props.state instanceof SubmittedState) {
      this._state = new SubmittedState();
    } else if (props.state === 'EVALUATING' || props.state instanceof EvaluatingState) {
      this._state = new EvaluatingState();
    } else if (props.state === 'EVALUATED' || props.state instanceof EvaluatedState) {
      this._state = new EvaluatedState();
    } else if (props.state === 'FAILED' || props.state instanceof FailedState) {
      this._state = new FailedState();
    } else {
      this._state = new DraftState();
    }
  }

  // Getters
  public get state(): AttemptState {
    return this._state;
  }

  public get status(): AttemptStatus {
    return this._state.status;
  }

  public get submission(): Submission {
    return this._submission;
  }

  public get evaluationId(): EvaluationId | null {
    return this._evaluationId;
  }

  public get submittedAt(): Date | null {
    return this._submittedAt;
  }

  public get errorMessage(): string | null {
    return this._errorMessage;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // State operations delegating to state object
  public saveDraft(content: Submission): void {
    this._state.saveDraft(this, content);
  }

  public submit(): void {
    this._state.submit(this);
  }

  public startEvaluation(): void {
    this._state.startEvaluation(this);
  }

  public completeEvaluation(evaluationId: EvaluationId): void {
    this._state.completeEvaluation(this, evaluationId);
  }

  public failEvaluation(reason: string): void {
    this._state.failEvaluation(this, reason);
  }

  public retryEvaluation(): void {
    this._state.retryEvaluation(this);
  }

  /**
   * Forks an existing attempt to begin a new iteration (Try Again / Refine).
   * Creates a new attempt in DRAFT status pre-populated with this attempt's solution.
   * The original attempt is left completely unchanged and immutable.
   */
  public fork(newAttemptId: AttemptId, newSubmissionId?: SubmissionId): Attempt {
    if (this.status !== 'EVALUATED') {
      throw new InvalidStateTransitionError(
        this.status,
        'fork',
        'Can only fork an attempt that has completed evaluation'
      );
    }

    const nextAttemptNumber = this.attemptNumber + 1;
    const subId = newSubmissionId || `${newAttemptId}_sub`;

    // Clone current submission
    let forkedSubmission: Submission;
    if (this.submission instanceof StructuredTextSubmission) {
      forkedSubmission = new StructuredTextSubmission(subId, this.submission.sections);
    } else {
      forkedSubmission = this.submission;
    }

    return new Attempt({
      id: newAttemptId,
      problemId: this.problemId,
      learnerId: this.learnerId,
      attemptNumber: nextAttemptNumber,
      parentAttemptId: this.id,
      submission: forkedSubmission,
      state: new DraftState(),
    });
  }

  // Internal lifecycle mutation helpers (invoked only by AttemptState classes)
  public _transitionTo(newState: AttemptState): void {
    this._state = newState;
    this._updatedAt = new Date();
  }

  public _setSubmission(content: Submission): void {
    this._submission = content;
    this._updatedAt = new Date();
  }

  public _setSubmittedAt(date: Date): void {
    this._submittedAt = date;
    this._updatedAt = new Date();
  }

  public _setEvaluationId(evaluationId: EvaluationId): void {
    this._evaluationId = evaluationId;
    this._updatedAt = new Date();
  }

  public _setErrorMessage(reason: string): void {
    this._errorMessage = reason;
    this._updatedAt = new Date();
  }

  public _clearError(): void {
    this._errorMessage = null;
    this._updatedAt = new Date();
  }

  /**
   * Factory method to start a fresh initial attempt
   */
  public static createNew(
    id: AttemptId,
    problemId: ProblemId,
    learnerId: LearnerId,
    initialSubmission?: Submission
  ): Attempt {
    const sub = initialSubmission || StructuredTextSubmission.createEmpty(`${id}_sub`);
    return new Attempt({
      id,
      problemId,
      learnerId,
      attemptNumber: 1,
      submission: sub,
      state: new DraftState(),
    });
  }
}
