import { Problem } from '../entities/Problem.js';
import { Submission } from '../entities/Submission.js';
import { RubricCriterion, Confidence } from '../types/common.types.js';

export interface NormalizedCriterionEvaluation {
  criterion: RubricCriterion;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: Confidence;
}

export interface EvaluationResult {
  overallScore: number;
  passed: boolean;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  criteriaScores: NormalizedCriterionEvaluation[];
  evaluatorType: string;
  modelName?: string;
  durationMs?: number;
  deterministicChecks?: Record<string, any>;
}

export interface IEvaluator {
  readonly evaluatorType: string;
  evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult>;
}
