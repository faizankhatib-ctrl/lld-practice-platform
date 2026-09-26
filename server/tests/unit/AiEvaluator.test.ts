import { describe, it, expect, vi } from 'vitest';
import { AiEvaluationResponseSchema } from '../../src/application/evaluators/aiEvaluationSchema.js';
import { GeminiAiEvaluator } from '../../src/application/evaluators/GeminiAiEvaluator.js';
import { MockEvaluator } from '../../src/application/evaluators/MockEvaluator.js';
import { createEvaluator } from '../../src/application/evaluators/evaluatorFactory.js';
import { EvaluationService } from '../../src/application/services/EvaluationService.js';
import { Problem } from '../../src/domain/entities/Problem.js';
import { StructuredTextSubmission } from '../../src/domain/entities/StructuredTextSubmission.js';
import { Attempt } from '../../src/domain/entities/Attempt.js';
import { RubricCriterion } from '../../src/domain/types/common.types.js';
import { IAttemptRepository, IProblemRepository, IEvaluationRepository } from '../../src/domain/interfaces/IRepositories.js';
import { env } from '../../src/config/env.js';

describe('AI Evaluation Unit Tests', () => {
  const createTestProblem = () =>
    new Problem({
      id: 'p-parking-lot',
      slug: 'parking-lot-system',
      title: 'Design a Parking Lot System',
      difficulty: 'MEDIUM',
      summary: 'Design an automated parking lot management system.',
      functionalRequirements: [
        'Multi-floor parking',
        'Ticket issuance',
        'Payment processing',
      ],
      nonFunctionalRequirements: ['High availability'],
      constraints: ['Fixed floor capacity'],
      requiredEntities: ['ParkingLot', 'ParkingSpot', 'Ticket', 'Vehicle'],
      suggestedPatterns: ['Strategy Pattern', 'Factory Pattern'],
    });

  const createTestSubmission = () =>
    new StructuredTextSubmission('sub-ai-1', {
      requirementsAndAssumptions: 'We need to design a multi-floor parking lot with spots and tickets.',
      classesAndResponsibilities: 'Entities include ParkingLot, ParkingSpot, Ticket, and Vehicle.',
      interfacesAndRelationships: 'interface IPaymentStrategy { pay(amount: number): boolean; }',
      designExplanation: 'Vehicle enters -> issue Ticket -> find Spot -> park. Vehicle leaves -> calculate fee -> pay.',
      tradeoffs: 'Dynamic allocation trade-off vs static floor pre-assignment.',
      edgeCases: 'Concurrency when two vehicles attempt to claim the last available spot.',
    });

  const getValidAiPayload = () => ({
    overallScore: 85,
    passed: true,
    summary: 'A robust and well-modularized low-level design for a parking lot.',
    strengths: ['Clear encapsulation of ParkingSpot', 'Clean payment strategy separation'],
    weaknesses: ['Add distributed lock for spot reservation'],
    criteriaScores: [
      {
        criterion: RubricCriterion.REQUIREMENT_UNDERSTANDING,
        score: 85,
        evidence: 'Candidate accurately listed multi-floor and ticket tracking.',
        concern: 'Did not detail vehicle size category handling.',
        suggestion: 'Add vehicle size dimension to parking spots.',
        confidence: 0.9,
      },
      {
        criterion: RubricCriterion.CLASS_RESPONSIBILITIES,
        score: 80,
        evidence: 'Clear separation between ParkingLot and ParkingSpot.',
        concern: '',
        suggestion: 'Separate ticketing logic into TicketService.',
        confidence: 0.85,
      },
      {
        criterion: RubricCriterion.COUPLING_COHESION,
        score: 75,
        evidence: 'ParkingSpot does not directly depend on payment processor.',
        concern: '',
        suggestion: 'Keep spot assignment decoupled from billing.',
        confidence: 0.8,
      },
      {
        criterion: RubricCriterion.ENCAPSULATION_INTERFACES,
        score: 85,
        evidence: 'IPaymentStrategy interface explicitly declared.',
        concern: '',
        suggestion: 'Make spot state private.',
        confidence: 0.9,
      },
      {
        criterion: RubricCriterion.ABSTRACTION_PATTERNS,
        score: 80,
        evidence: 'Strategy pattern implemented for pricing.',
        concern: '',
        suggestion: 'Consider Factory for vehicle creation.',
        confidence: 0.85,
      },
      {
        criterion: RubricCriterion.EXTENSIBILITY,
        score: 80,
        evidence: 'Dynamic parking spot allocation strategy cited.',
        concern: '',
        suggestion: 'Prepare for valet service extension.',
        confidence: 0.8,
      },
      {
        criterion: RubricCriterion.EDGE_CASES_TESTABILITY,
        score: 70,
        evidence: 'Concurrency for the last spot mentioned.',
        concern: 'No mutex or synchronization mechanism specified.',
        suggestion: 'Use an atomic check-and-set or lock.',
        confidence: 0.75,
      },
      {
        criterion: RubricCriterion.EXPLANATION_QUALITY,
        score: 85,
        evidence: 'Structured explanation covers lifecycle end-to-end.',
        concern: '',
        suggestion: 'Add sequence diagrams in future.',
        confidence: 0.9,
      },
    ],
  });

  // 1. AI response schema validation
  it('1. should validate a correctly formatted AI response payload against schema', () => {
    const payload = getValidAiPayload();
    const result = AiEvaluationResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  // 2. valid AI JSON accepted
  it('2. should accept valid AI JSON and parse correctly', () => {
    const payload = getValidAiPayload();
    const jsonString = JSON.stringify(payload);
    const parsed = JSON.parse(jsonString);
    const result = AiEvaluationResponseSchema.safeParse(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.criteriaScores.length).toBe(8);
      expect(result.data.criteriaScores[0].criterion).toBe(RubricCriterion.REQUIREMENT_UNDERSTANDING);
    }
  });

  // 3. invalid score rejected
  it('3. should reject AI payload with score out of bounds (< 0 or > 100)', () => {
    const payloadNegative = getValidAiPayload();
    payloadNegative.criteriaScores[0].score = -5;
    expect(AiEvaluationResponseSchema.safeParse(payloadNegative).success).toBe(false);

    const payloadTooHigh = getValidAiPayload();
    payloadTooHigh.criteriaScores[0].score = 105;
    expect(AiEvaluationResponseSchema.safeParse(payloadTooHigh).success).toBe(false);
  });

  // 4. missing criterion rejected
  it('4. should reject AI payload if any canonical rubric criterion is missing', () => {
    const payload = getValidAiPayload();
    // Replace the 8th criterion with a duplicate of the 1st
    payload.criteriaScores[7] = {
      ...payload.criteriaScores[7],
      criterion: RubricCriterion.REQUIREMENT_UNDERSTANDING,
    };
    const result = AiEvaluationResponseSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes('Missing required rubric criterion'));
      expect(issue).toBeDefined();
    }
  });

  // 5. wrong number of criteria rejected
  it('5. should reject AI payload with fewer or more than 8 criteria', () => {
    const payloadFew = getValidAiPayload();
    payloadFew.criteriaScores.pop(); // 7 criteria
    expect(AiEvaluationResponseSchema.safeParse(payloadFew).success).toBe(false);

    const payloadMany = getValidAiPayload();
    payloadMany.criteriaScores.push({ ...payloadMany.criteriaScores[0] }); // 9 criteria
    expect(AiEvaluationResponseSchema.safeParse(payloadMany).success).toBe(false);
  });

  // 6. invalid confidence rejected
  it('6. should reject AI payload with confidence outside 0-1 range', () => {
    const payloadLow = getValidAiPayload();
    payloadLow.criteriaScores[0].confidence = -0.1;
    expect(AiEvaluationResponseSchema.safeParse(payloadLow).success).toBe(false);

    const payloadHigh = getValidAiPayload();
    payloadHigh.criteriaScores[0].confidence = 1.5;
    expect(AiEvaluationResponseSchema.safeParse(payloadHigh).success).toBe(false);
  });

  // 7. application calculates overall score (deterministic control over model arithmetic)
  it('7. should compute overallScore deterministically from criteria scores, overriding raw model score', async () => {
    const payload = getValidAiPayload();
    // Set 8 criteria scores to: 80, 80, 80, 80, 80, 80, 80, 80 => total = 640 => avg = 80
    payload.criteriaScores.forEach((c) => (c.score = 80));
    // Simulate model returning a conflicting overallScore of 99
    payload.overallScore = 99;

    const mockAiClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify(payload),
        }),
      },
    };

    const evaluator = new GeminiAiEvaluator({
      apiKey: 'test-fake-key',
      aiClient: mockAiClient,
    });

    const result = await evaluator.evaluate(createTestProblem(), createTestSubmission());
    // Application must compute Math.round(640 / 8) = 80, NOT 99
    expect(result.overallScore).toBe(80);
    expect(result.overallScore).not.toBe(99);
  });

  // 8. application calculates passed status
  it('8. should calculate passed status based on the passing threshold (>= 70), overriding model passed flag', async () => {
    const payloadFailing = getValidAiPayload();
    // Set criteria scores such that avg is 60 (< 70)
    payloadFailing.criteriaScores.forEach((c) => (c.score = 60));
    payloadFailing.passed = true; // Model hallucinating "passed = true" for score of 60

    const mockAiClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify(payloadFailing),
        }),
      },
    };

    const evaluator = new GeminiAiEvaluator({
      apiKey: 'test-fake-key',
      aiClient: mockAiClient,
    });

    const result = await evaluator.evaluate(createTestProblem(), createTestSubmission());
    expect(result.overallScore).toBe(60);
    expect(result.passed).toBe(false); // Application enforces threshold rule
  });

  // 9. AI provider failure becomes safe evaluation failure
  it('9. should safely catch AI provider failures and throw a sanitized AppError without leaking internals', async () => {
    const mockAiClient = {
      models: {
        generateContent: vi.fn().mockRejectedValue(new Error('Internal remote connection reset with key secret_xyz123')),
      },
    };

    const evaluator = new GeminiAiEvaluator({
      apiKey: 'test-fake-key',
      aiClient: mockAiClient,
    });

    await expect(evaluator.evaluate(createTestProblem(), createTestSubmission())).rejects.toThrow(
      'AI service temporarily unavailable. Please retry.'
    );
  });

  // 10. candidate submission is preserved after AI failure
  it('10. should preserve candidate submission and mark attempt as FAILED when evaluation fails', async () => {
    const problem = createTestProblem();
    const submission = createTestSubmission();
    const attempt = new Attempt({
      id: 'att-fail-test',
      problemId: problem.id,
      learnerId: 'learner-1',
      attemptNumber: 1,
      submission,
    });

    attempt.submit();

    // Mock Repositories
    let persistedAttempt: Attempt = attempt;
    const attemptRepo: IAttemptRepository = {
      findById: async (id: string) => (id === attempt.id ? persistedAttempt : null),
      save: async (att: Attempt) => {
        persistedAttempt = att;
      },
      countByProblemAndLearner: async () => 1,
      findByLearnerId: async () => [persistedAttempt],
      findByProblemId: async () => [persistedAttempt],
      findByProblemAndLearner: async () => [persistedAttempt],
    };

    const problemRepo: IProblemRepository = {
      findById: async (id: string) => (id === problem.id ? problem : null),
      findBySlug: async (slug: string) => (slug === problem.slug ? problem : null),
      findAll: async () => [problem],
      save: async () => {},
    };

    const evalRepo: IEvaluationRepository = {
      findById: async () => null,
      save: async () => {},
      findByAttemptId: async () => null,
      findByProblemId: async () => [],
    };

    // Failing Evaluator
    const failingEvaluator = new GeminiAiEvaluator({
      apiKey: 'test-fake-key',
      aiClient: {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('Timeout')),
        },
      },
    });

    const evaluationService = new EvaluationService(attemptRepo, problemRepo, evalRepo, failingEvaluator);

    // Act & Assert failure
    await expect(evaluationService.evaluateAttempt(attempt.id)).rejects.toThrow();

    // Verify Attempt state
    expect(persistedAttempt.status).toBe('FAILED');
    expect(persistedAttempt.errorMessage).toBeDefined();

    // CRITICAL: Verify candidate submission was preserved completely
    expect(persistedAttempt.submission).toBeDefined();
    expect(persistedAttempt.submission.getCombinedText()).toBe(submission.getCombinedText());
  });

  // 11. MockEvaluator still works
  it('11. should confirm MockEvaluator continues to function properly as fallback', async () => {
    const mockEvaluator = new MockEvaluator();
    expect(mockEvaluator.evaluatorType).toBe('MOCK_DETERMINISTIC');

    const problem = createTestProblem();
    const submission = createTestSubmission();

    const result = await mockEvaluator.evaluate(problem, submission);
    expect(result.criteriaScores.length).toBe(8);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(typeof result.passed).toBe('boolean');
    expect(result.summary).toBeDefined();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  // 12. evaluator factory selects MockEvaluator when AI disabled or key missing
  it('12. should select MockEvaluator when AI is disabled or when API key is missing', () => {
    // Case A: AI explicitly disabled
    env.AI_EVALUATOR_ENABLED = false;
    const evalWhenDisabled = createEvaluator();
    expect(evalWhenDisabled.evaluatorType).toBe('MOCK_DETERMINISTIC');

    // Case B: AI enabled but missing API key
    env.AI_EVALUATOR_ENABLED = true;
    env.GEMINI_API_KEY = '';
    const evalWhenMissingKey = createEvaluator();
    expect(evalWhenMissingKey.evaluatorType).toBe('MOCK_DETERMINISTIC');

    // Case C: AI enabled with API key -> selects AI_GEMINI
    env.AI_EVALUATOR_ENABLED = true;
    env.GEMINI_API_KEY = 'test-valid-looking-key';
    const evalWhenEnabled = createEvaluator();
    expect(evalWhenEnabled.evaluatorType).toBe('AI_GEMINI');

    // Reset back to safe defaults
    env.AI_EVALUATOR_ENABLED = false;
    env.GEMINI_API_KEY = '';
  });
});
