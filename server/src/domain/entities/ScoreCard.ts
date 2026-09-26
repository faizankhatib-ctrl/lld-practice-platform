import { RubricCriterion, CriterionResult } from '../types/common.types.js';
import { InvalidArgumentError } from '../errors/DomainErrors.js';

export class ScoreCard {
  private readonly criteriaMap: Map<RubricCriterion, CriterionResult>;

  constructor(criteriaResults: CriterionResult[]) {
    if (!criteriaResults || criteriaResults.length === 0) {
      throw new InvalidArgumentError('ScoreCard requires criterion results');
    }

    this.criteriaMap = new Map();

    for (const result of criteriaResults) {
      if (result.score < 0 || result.score > result.maxScore) {
        throw new InvalidArgumentError(
          `Score for '${result.criterion}' (${result.score}) must be between 0 and maxScore (${result.maxScore})`
        );
      }
      this.criteriaMap.set(result.criterion, Object.freeze({ ...result }));
    }
  }

  public getCriterion(criterion: RubricCriterion): CriterionResult | undefined {
    return this.criteriaMap.get(criterion);
  }

  public getAllCriteria(): CriterionResult[] {
    return Array.from(this.criteriaMap.values());
  }

  /**
   * Computes the normalized overall score out of 100 (percentage).
   */
  public calculateOverallScore(): number {
    const results = this.getAllCriteria();
    if (results.length === 0) return 0;

    let totalEarned = 0;
    let totalPossible = 0;

    for (const res of results) {
      totalEarned += res.score;
      totalPossible += res.maxScore;
    }

    if (totalPossible === 0) return 0;
    return Math.round((totalEarned / totalPossible) * 100);
  }
}
