import { IAttemptRepository } from '../domain/interfaces/IRepositories.js';
import { Attempt } from '../domain/entities/Attempt.js';
import { StructuredTextSubmission } from '../domain/entities/StructuredTextSubmission.js';
import { AttemptId, ProblemId, LearnerId } from '../domain/types/common.types.js';
import { AttemptModel, IAttemptDocument } from '../models/AttemptModel.js';

export class AttemptRepository implements IAttemptRepository {
  public async findById(id: AttemptId): Promise<Attempt | null> {
    const doc = await AttemptModel.findById(id).lean<IAttemptDocument | null>();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async findByProblemAndLearner(
    problemId: ProblemId,
    learnerId: LearnerId
  ): Promise<Attempt[]> {
    const docs = await AttemptModel.find({ problemId, learnerId })
      .sort({ attemptNumber: 1 })
      .lean<IAttemptDocument[]>();

    return docs.map((doc) => this.toDomain(doc));
  }

  public async findLatestAttempt(
    problemId: ProblemId,
    learnerId: LearnerId
  ): Promise<Attempt | null> {
    const doc = await AttemptModel.findOne({ problemId, learnerId })
      .sort({ attemptNumber: -1 })
      .lean<IAttemptDocument | null>();

    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async countByProblemAndLearner(
    problemId: ProblemId,
    learnerId: LearnerId
  ): Promise<number> {
    return AttemptModel.countDocuments({ problemId, learnerId });
  }

  public async save(attempt: Attempt): Promise<void> {
    const content =
      attempt.submission instanceof StructuredTextSubmission
        ? {
            requirementsAndAssumptions: attempt.submission.sections.requirementsAndAssumptions,
            classesAndResponsibilities: attempt.submission.sections.classesAndResponsibilities,
            interfacesAndRelationships: attempt.submission.sections.interfacesAndRelationships,
            designExplanation: attempt.submission.sections.designExplanation,
            tradeoffs: attempt.submission.sections.tradeoffs,
            edgeCases: attempt.submission.sections.edgeCases,
          }
        : {
            requirementsAndAssumptions: '',
            classesAndResponsibilities: '',
            interfacesAndRelationships: '',
            designExplanation: '',
            tradeoffs: '',
            edgeCases: '',
          };

    await AttemptModel.findByIdAndUpdate(
      attempt.id,
      {
        _id: attempt.id,
        problemId: attempt.problemId,
        learnerId: attempt.learnerId,
        attemptNumber: attempt.attemptNumber,
        parentAttemptId: attempt.parentAttemptId,
        status: attempt.status,
        submissionFormat: attempt.submission.format,
        content,
        submittedAt: attempt.submittedAt,
        evaluationId: attempt.evaluationId,
        errorMessage: attempt.errorMessage,
        updatedAt: attempt.updatedAt,
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  private toDomain(doc: IAttemptDocument): Attempt {
    const submission = new StructuredTextSubmission(
      `${doc._id.toString()}_sub`,
      {
        requirementsAndAssumptions: doc.content?.requirementsAndAssumptions || '',
        classesAndResponsibilities: doc.content?.classesAndResponsibilities || '',
        interfacesAndRelationships: doc.content?.interfacesAndRelationships || '',
        designExplanation: doc.content?.designExplanation || '',
        tradeoffs: doc.content?.tradeoffs || '',
        edgeCases: doc.content?.edgeCases || '',
      },
      doc.createdAt
    );

    return new Attempt({
      id: doc._id.toString(),
      problemId: doc.problemId,
      learnerId: doc.learnerId,
      attemptNumber: doc.attemptNumber,
      parentAttemptId: doc.parentAttemptId,
      state: doc.status,
      submission,
      submittedAt: doc.submittedAt,
      evaluationId: doc.evaluationId,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
