import { describe, it, expect } from 'vitest';
import { Evaluation } from '../../src/domain/entities/Evaluation.js';
import { ScoreCard } from '../../src/domain/entities/ScoreCard.js';
import { RubricCriterion, CriterionResult } from '../../src/domain/types/common.types.js';
import { InvalidArgumentError } from '../../src/domain/errors/DomainErrors.js';

describe('Evaluation & ScoreCard Domain Entities', () => {
  const createSampleCriteria = (scores: number[] = [4, 4, 3, 5, 4, 4, 3, 5]): CriterionResult[] => {
    const rubricKeys = [
      RubricCriterion.REQUIREMENT_UNDERSTANDING,
      RubricCriterion.CLASS_RESPONSIBILITIES,
      RubricCriterion.COUPLING_COHESION,
      RubricCriterion.ENCAPSULATION_INTERFACES,
      RubricCriterion.ABSTRACTION_PATTERNS,
      RubricCriterion.EXTENSIBILITY,
      RubricCriterion.EDGE_CASES_TESTABILITY,
      RubricCriterion.EXPLANATION_QUALITY,
    ];

    return rubricKeys.map((criterion, idx) => ({
      criterion,
      score: scores[idx],
      maxScore: 5,
      evidence: `Evidence found for ${criterion}`,
      concern: `Minor concern regarding ${criterion}`,
      suggestion: `Suggestion to improve ${criterion}`,
      confidence: 'HIGH' as const,
    }));
  };

  it('should calculate normalized overall score (percentage out of 100)', () => {
    // Total earned: 4+4+3+5+4+4+3+5 = 32 out of 40 = 80%
    const criteria = createSampleCriteria();
    const scoreCard = new ScoreCard(criteria);
    const evaluation = new Evaluation({
      id: 'eval-1',
      attemptId: 'att-1',
      problemId: 'prob-1',
      scoreCard,
      summary: 'Solid architectural design with clean interfaces.',
      strengths: ['Great interface segregation', 'Appropriate use of Strategy pattern'],
      weaknesses: ['Could improve concurrency handling in slot assignment'],
    });

    expect(evaluation.getOverallScore()).toBe(80);
    expect(evaluation.isPassing(70)).toBe(true);
    expect(evaluation.isPassing(85)).toBe(false);
  });

  it('should retrieve individual criterion evaluation correctly', () => {
    const criteria = createSampleCriteria();
    const scoreCard = new ScoreCard(criteria);
    const evaluation = new Evaluation({
      id: 'eval-2',
      attemptId: 'att-1',
      problemId: 'prob-1',
      scoreCard,
      summary: 'Summary',
      strengths: [],
      weaknesses: [],
    });

    const result = evaluation.getCriterionScore(RubricCriterion.ABSTRACTION_PATTERNS);
    expect(result).toBeDefined();
    expect(result?.criterion).toBe(RubricCriterion.ABSTRACTION_PATTERNS);
    expect(result?.score).toBe(4);
    expect(result?.maxScore).toBe(5);
    expect(result?.confidence).toBe('HIGH');
  });

  it('should reject scores that exceed maxScore or are negative', () => {
    expect(
      () =>
        new ScoreCard([
          {
            criterion: RubricCriterion.CLASS_RESPONSIBILITIES,
            score: 6, // > maxScore 5
            maxScore: 5,
            evidence: '',
            concern: '',
            suggestion: '',
            confidence: 'HIGH',
          },
        ])
    ).toThrow(InvalidArgumentError);

    expect(
      () =>
        new ScoreCard([
          {
            criterion: RubricCriterion.CLASS_RESPONSIBILITIES,
            score: -1, // Negative
            maxScore: 5,
            evidence: '',
            concern: '',
            suggestion: '',
            confidence: 'LOW',
          },
        ])
    ).toThrow(InvalidArgumentError);
  });

  it('should throw InvalidArgumentError when Evaluation required fields are missing', () => {
    const scoreCard = new ScoreCard(createSampleCriteria());

    expect(
      () =>
        new Evaluation({
          id: '',
          attemptId: 'att-1',
          problemId: 'prob-1',
          scoreCard,
          summary: 'Summary',
          strengths: [],
          weaknesses: [],
        })
    ).toThrow(InvalidArgumentError);

    expect(
      () =>
        new Evaluation({
          id: 'eval-1',
          attemptId: 'att-1',
          problemId: 'prob-1',
          scoreCard,
          summary: '', // Empty summary
          strengths: [],
          weaknesses: [],
        })
    ).toThrow(InvalidArgumentError);
  });
});
