import { Request, Response, NextFunction } from 'express';
import { ProblemService } from '../application/services/ProblemService.js';
import { AttemptService } from '../application/services/AttemptService.js';

export class ProblemController {
  constructor(
    private readonly problemService: ProblemService,
    private readonly attemptService: AttemptService
  ) {}

  public listProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const problems = await this.problemService.listProblems();
      const mapped = problems.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        estimatedTimeMinutes: p.estimatedTimeMinutes,
        summary: p.summary,
        suggestedPatterns: p.suggestedPatterns,
        requiredEntities: p.requiredEntities,
      }));

      res.status(200).json({
        success: true,
        data: mapped,
      });
    } catch (error) {
      next(error);
    }
  };

  public getProblemByIdOrSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrSlug = req.params.idOrSlug as string;
      const problem = await this.problemService.getProblemByIdOrSlug(idOrSlug);

      res.status(200).json({
        success: true,
        data: {
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          estimatedTimeMinutes: problem.estimatedTimeMinutes,
          summary: problem.summary,
          functionalRequirements: problem.functionalRequirements,
          nonFunctionalRequirements: problem.nonFunctionalRequirements,
          constraints: problem.constraints,
          requiredEntities: problem.requiredEntities,
          suggestedPatterns: problem.suggestedPatterns,
          rubricCriteria: problem.getRubricCriteria(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getProblemAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const history = await this.attemptService.getAttemptHistory(id, req.learnerId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
