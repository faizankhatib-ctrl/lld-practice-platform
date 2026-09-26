import { IEvaluationRepository } from '../domain/interfaces/IRepositories.js';
import { Evaluation } from '../domain/entities/Evaluation.js';
import { ScoreCard } from '../domain/entities/ScoreCard.js';
import {
  EvaluationId,
  AttemptId,
  RubricCriterion,
  CriterionResult,
} from '../domain/types/common.types.js';
import { EvaluationModel, IEvaluationDocument } from '../models/EvaluationModel.js';

export class EvaluationRepository implements IEvaluationRepository {
  public async findById(id: EvaluationId): Promise<Evaluation | null> {
    const doc = await EvaluationModel.findById(id).lean<IEvaluationDocument | null>();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async findByAttemptId(attemptId: AttemptId): Promise<Evaluation | null> {
    const doc = await EvaluationModel.findOne({ attemptId }).lean<IEvaluationDocument | null>();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async save(evaluation: Evaluation): Promise<void> {
    const criteriaScores = evaluation.scoreCard.getAllCriteria().map((c) => ({
      criterionKey: c.criterion,
      criterionName: c.criterion,
      score: c.score,
      maxScore: c.maxScore,
      weight: 1,
      evidence: c.evidence,
      concern: c.concern,
      suggestion: c.suggestion,
      confidence: c.confidence,
    }));

    await EvaluationModel.findByIdAndUpdate(
      evaluation.id,
      {
        _id: evaluation.id,
        attemptId: evaluation.attemptId,
        problemId: evaluation.problemId,
        overallScore: evaluation.getOverallScore(),
        passed: evaluation.isPassing(),
        summary: evaluation.summary,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        criteriaScores,
        createdAt: evaluation.createdAt,
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  private toDomain(doc: IEvaluationDocument): Evaluation {
    const criterionResults: CriterionResult[] = doc.criteriaScores.map((cs) => ({
      criterion: cs.criterionName as RubricCriterion,
      score: cs.score,
      maxScore: cs.maxScore,
      evidence: cs.evidence,
      concern: cs.concern,
      suggestion: cs.suggestion,
      confidence: cs.confidence,
    }));

    const scoreCard = new ScoreCard(criterionResults);

    return new Evaluation({
      id: doc._id.toString(),
      attemptId: doc.attemptId,
      problemId: doc.problemId,
      scoreCard,
      summary: doc.summary,
      strengths: doc.strengths || [],
      weaknesses: doc.weaknesses || [],
      createdAt: doc.createdAt,
    });
  }
}
