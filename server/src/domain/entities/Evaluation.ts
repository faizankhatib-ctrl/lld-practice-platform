import { EvaluationId, AttemptId, ProblemId, RubricCriterion, CriterionResult } from '../types/common.types.js';
import { ScoreCard } from './ScoreCard.js';
import { InvalidArgumentError } from '../errors/DomainErrors.js';

export interface EvaluationProps {
  id: EvaluationId;
  attemptId: AttemptId;
  problemId: ProblemId;
  scoreCard: ScoreCard;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  createdAt?: Date;
}

export class Evaluation {
  public readonly id: EvaluationId;
  public readonly attemptId: AttemptId;
  public readonly problemId: ProblemId;
  public readonly scoreCard: ScoreCard;
  public readonly summary: string;
  public readonly strengths: ReadonlyArray<string>;
  public readonly weaknesses: ReadonlyArray<string>;
  public readonly createdAt: Date;

  constructor(props: EvaluationProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new InvalidArgumentError('Evaluation ID cannot be empty');
    }
    if (!props.attemptId || props.attemptId.trim().length === 0) {
      throw new InvalidArgumentError('Attempt ID cannot be empty');
    }
    if (!props.problemId || props.problemId.trim().length === 0) {
      throw new InvalidArgumentError('Problem ID cannot be empty');
    }
    if (!props.scoreCard) {
      throw new InvalidArgumentError('ScoreCard is required for an Evaluation');
    }
    if (!props.summary || props.summary.trim().length === 0) {
      throw new InvalidArgumentError('Evaluation summary cannot be empty');
    }

    this.id = props.id;
    this.attemptId = props.attemptId;
    this.problemId = props.problemId;
    this.scoreCard = props.scoreCard;
    this.summary = props.summary;
    this.strengths = Object.freeze([...(props.strengths || [])]);
    this.weaknesses = Object.freeze([...(props.weaknesses || [])]);
    this.createdAt = props.createdAt || new Date();
  }

  /**
   * Returns the normalized overall score (0 to 100).
   */
  public getOverallScore(): number {
    return this.scoreCard.calculateOverallScore();
  }

  /**
   * Evaluates if the attempt meets the passing score threshold.
   * Default threshold is 70 out of 100.
   */
  public isPassing(passingThreshold = 70): boolean {
    return this.getOverallScore() >= passingThreshold;
  }

  /**
   * Retrieves a specific criterion's evaluation details.
   */
  public getCriterionScore(criterion: RubricCriterion): CriterionResult | undefined {
    return this.scoreCard.getCriterion(criterion);
  }
}
