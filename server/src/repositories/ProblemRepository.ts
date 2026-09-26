import { IProblemRepository } from '../domain/interfaces/IRepositories.js';
import { Problem } from '../domain/entities/Problem.js';
import { ProblemId } from '../domain/types/common.types.js';
import { ProblemModel, IProblemDocument } from '../models/ProblemModel.js';

export class ProblemRepository implements IProblemRepository {
  public async findById(id: ProblemId): Promise<Problem | null> {
    const doc = await ProblemModel.findById(id).lean<IProblemDocument | null>();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async findBySlug(slug: string): Promise<Problem | null> {
    const doc = await ProblemModel.findOne({ slug: slug.toLowerCase() }).lean<IProblemDocument | null>();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async findAll(): Promise<Problem[]> {
    const docs = await ProblemModel.find({ active: true }).sort({ createdAt: 1 }).lean<IProblemDocument[]>();
    return docs.map((doc) => this.toDomain(doc));
  }

  public async save(problem: Problem): Promise<void> {
    await ProblemModel.findByIdAndUpdate(
      problem.id,
      {
        _id: problem.id,
        slug: problem.slug.toLowerCase(),
        title: problem.title,
        difficulty: problem.difficulty,
        estimatedTimeMinutes: problem.estimatedTimeMinutes,
        summary: problem.summary,
        functionalRequirements: problem.functionalRequirements,
        nonFunctionalRequirements: problem.nonFunctionalRequirements,
        constraints: problem.constraints,
        suggestedPatterns: problem.suggestedPatterns,
        requiredEntities: problem.requiredEntities,
        active: true,
        rubricConfig: {
          criteriaKeys: problem.getRubricCriteria(),
          passingScore: 70,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  /**
   * Upserts a problem matching by slug (useful for seeding and initial problem setup)
   */
  public async upsertBySlug(problem: Problem): Promise<void> {
    await ProblemModel.findOneAndUpdate(
      { slug: problem.slug.toLowerCase() },
      {
        $setOnInsert: { _id: problem.id },
        $set: {
          title: problem.title,
          difficulty: problem.difficulty,
          estimatedTimeMinutes: problem.estimatedTimeMinutes,
          summary: problem.summary,
          functionalRequirements: problem.functionalRequirements,
          nonFunctionalRequirements: problem.nonFunctionalRequirements,
          constraints: problem.constraints,
          suggestedPatterns: problem.suggestedPatterns,
          requiredEntities: problem.requiredEntities,
          active: true,
          rubricConfig: {
            criteriaKeys: problem.getRubricCriteria(),
            passingScore: 70,
          },
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  private toDomain(doc: IProblemDocument): Problem {
    return new Problem({
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
      estimatedTimeMinutes: doc.estimatedTimeMinutes,
      summary: doc.summary,
      functionalRequirements: doc.functionalRequirements,
      nonFunctionalRequirements: doc.nonFunctionalRequirements,
      constraints: doc.constraints,
      suggestedPatterns: doc.suggestedPatterns,
      requiredEntities: doc.requiredEntities,
    });
  }
}
