import { Problem } from '../entities/Problem.js';
import { Attempt } from '../entities/Attempt.js';
import { Evaluation } from '../entities/Evaluation.js';
import { ProblemId, AttemptId, EvaluationId, LearnerId } from '../types/common.types.js';

export interface IProblemRepository {
  findById(id: ProblemId): Promise<Problem | null>;
  findBySlug(slug: string): Promise<Problem | null>;
  findAll(): Promise<Problem[]>;
  save(problem: Problem): Promise<void>;
}

export interface IAttemptRepository {
  findById(id: AttemptId): Promise<Attempt | null>;
  findByProblemAndLearner(problemId: ProblemId, learnerId: LearnerId): Promise<Attempt[]>;
  findLatestAttempt(problemId: ProblemId, learnerId: LearnerId): Promise<Attempt | null>;
  countByProblemAndLearner(problemId: ProblemId, learnerId: LearnerId): Promise<number>;
  save(attempt: Attempt): Promise<void>;
}

export interface IEvaluationRepository {
  findById(id: EvaluationId): Promise<Evaluation | null>;
  findByAttemptId(attemptId: AttemptId): Promise<Evaluation | null>;
  save(evaluation: Evaluation): Promise<void>;
}
