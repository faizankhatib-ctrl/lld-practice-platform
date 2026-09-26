import { z } from 'zod';
import { RubricCriterion } from '../../domain/types/common.types.js';

const canonicalCriteria = Object.values(RubricCriterion);

export const AiCriterionScoreSchema = z.object({
  criterion: z.nativeEnum(RubricCriterion, {
    errorMap: () => ({ message: `Criterion must be one of the 8 canonical rubric dimensions` }),
  }),
  score: z.number().min(0, 'Score must be >= 0').max(100, 'Score must be <= 100'),
  evidence: z.string().min(1, 'Evidence must be non-empty and cite student work'),
  concern: z.string().default(''),
  suggestion: z.string().min(1, 'Suggestion must be non-empty'),
  confidence: z.number().min(0, 'Confidence must be >= 0').max(1, 'Confidence must be <= 1'),
});

export const AiEvaluationResponseSchema = z
  .object({
    overallScore: z.number().min(0).max(100),
    passed: z.boolean(),
    summary: z.string().min(10, 'Summary must be at least 10 characters'),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    criteriaScores: z.array(AiCriterionScoreSchema),
  })
  .superRefine((data, ctx) => {
    // Exactly 8 criteria must be returned
    if (data.criteriaScores.length !== 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Expected exactly 8 criteria scores, received ${data.criteriaScores.length}`,
        path: ['criteriaScores'],
      });
      return;
    }

    // Every canonical rubric criterion must be uniquely present
    const receivedCriteria = new Set(data.criteriaScores.map((c) => c.criterion));
    for (const expected of canonicalCriteria) {
      if (!receivedCriteria.has(expected)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing required rubric criterion: '${expected}'`,
          path: ['criteriaScores'],
        });
      }
    }
  });

export type AiCriterionScore = z.infer<typeof AiCriterionScoreSchema>;
export type AiEvaluationResponse = z.infer<typeof AiEvaluationResponseSchema>;
