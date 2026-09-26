import { IProblemRepository } from '../../domain/interfaces/IRepositories.js';
import { Problem } from '../../domain/entities/Problem.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ProblemService {
  constructor(private readonly problemRepository: IProblemRepository) {}

  public async listProblems(): Promise<Problem[]> {
    return this.problemRepository.findAll();
  }

  public async getProblemById(id: string): Promise<Problem> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new AppError(`Problem not found with ID '${id}'`, 404, 'NOT_FOUND');
    }
    return problem;
  }

  public async getProblemBySlug(slug: string): Promise<Problem> {
    const problem = await this.problemRepository.findBySlug(slug);
    if (!problem) {
      throw new AppError(`Problem not found with slug '${slug}'`, 404, 'NOT_FOUND');
    }
    return problem;
  }

  public async getProblemByIdOrSlug(idOrSlug: string): Promise<Problem> {
    // Try finding by slug first, then by ID
    let problem = await this.problemRepository.findBySlug(idOrSlug);
    if (!problem) {
      problem = await this.problemRepository.findById(idOrSlug);
    }
    if (!problem) {
      throw new AppError(`Problem not found with ID or slug '${idOrSlug}'`, 404, 'NOT_FOUND');
    }
    return problem;
  }
}
