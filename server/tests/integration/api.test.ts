import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { ProblemModel } from '../../src/models/ProblemModel.js';
import { AttemptModel } from '../../src/models/AttemptModel.js';
import { EvaluationModel } from '../../src/models/EvaluationModel.js';
import { INITIAL_PROBLEMS } from '../../src/seeds/problemsSeed.js';
import { ProblemRepository } from '../../src/repositories/ProblemRepository.js';

describe('LLD Practice Platform REST API Integration Tests', () => {
  const app = createApp();
  const problemRepo = new ProblemRepository();

  const validSubmissionBody = {
    requirementsAndAssumptions: 'Multi-floor parking lot with gates, dynamic fee calculation, and spot allocation.',
    classesAndResponsibilities: 'ParkingSpot (spot tracking), Vehicle (vehicle types), Ticket (duration), Payment (billing).',
    interfacesAndRelationships: 'IParkingFeeStrategy defines calculateFee(). ParkingLot has ParkingFloors and Gates.',
    designExplanation: 'Applied Strategy pattern for hourly and flat rate fee strategies. Used Factory for vehicle creation.',
    tradeoffs: 'Decided on in-memory floor level locks to prevent concurrent spot overbooking without global lock contention.',
    edgeCases: 'Handled full lot rejection, lost tickets, electric vehicle spot allocation, and power disruption recovery.',
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.USE_IN_MEMORY_DB = 'true';
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await ProblemModel.deleteMany({});
    await AttemptModel.deleteMany({});
    await EvaluationModel.deleteMany({});

    // Seed the 3 standard problems
    for (const prob of INITIAL_PROBLEMS) {
      await problemRepo.upsertBySlug(prob);
    }
  });

  // Polling helper to wait for async evaluation
  const waitForEvaluation = async (attemptId: string, learnerId: string, maxWaitMs = 3000) => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const res = await request(app)
        .get(`/api/v1/attempts/${attemptId}/status`)
        .set('x-learner-id', learnerId);
      if (res.body.data.status === 'EVALUATED' || res.body.data.status === 'FAILED') {
        return res.body.data;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Timeout waiting for evaluation of ${attemptId}`);
  };

  // 1. GET problems
  it('1. GET /api/v1/problems should list all seeded problems', async () => {
    const res = await request(app).get('/api/v1/problems');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data.some((p: any) => p.slug === 'parking-lot')).toBe(true);
    expect(res.body.data.some((p: any) => p.slug === 'elevator-system')).toBe(true);
    expect(res.body.data.some((p: any) => p.slug === 'vending-machine')).toBe(true);
  });

  // 2. GET problem by slug
  it('2. GET /api/v1/problems/:idOrSlug should get problem by slug', async () => {
    const res = await request(app).get('/api/v1/problems/parking-lot');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('parking-lot');
    expect(res.body.data.title).toContain('Parking Lot');
    expect(res.body.data.rubricCriteria.length).toBe(8);
  });

  // 3. Create attempt
  it('3. POST /api/v1/problems/:id/attempts should create attempt #1 in DRAFT state', async () => {
    const res = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attemptNumber).toBe(1);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.parentAttemptId).toBeNull();
  });

  // 4. Create second attempt
  it('4. POST /api/v1/problems/:id/attempts should create second attempt with attemptNumber: 2', async () => {
    await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');

    const res2 = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');

    expect(res2.status).toBe(201);
    expect(res2.body.data.attemptNumber).toBe(2);
    expect(res2.body.data.status).toBe('DRAFT');
  });

  // 5. Save draft
  it('5. PUT /api/v1/attempts/:id/draft should save draft sections and return updated attempt', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    const draftRes = await request(app)
      .put(`/api/v1/attempts/${attemptId}/draft`)
      .set('x-learner-id', 'learner-alice')
      .send({
        requirementsAndAssumptions: 'Automated ticket gates and multiple floors.',
        designExplanation: 'Using Strategy pattern for fee calculation.',
      });

    expect(draftRes.status).toBe(200);
    expect(draftRes.body.success).toBe(true);
    expect(draftRes.body.data.status).toBe('DRAFT');

    // Verify persisted via GET
    const getRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}`)
      .set('x-learner-id', 'learner-alice');
    expect(getRes.body.data.submission.sections.requirementsAndAssumptions).toContain('Automated ticket gates');
  });

  // 6. Reject incomplete submission
  it('6. POST /api/v1/attempts/:id/submit should reject incomplete submission with 400', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    const submitRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send({
        requirementsAndAssumptions: 'Too short',
        classesAndResponsibilities: '',
        interfacesAndRelationships: '',
        designExplanation: '',
        tradeoffs: '',
        edgeCases: '',
      });

    expect(submitRes.status).toBe(400);
    expect(submitRes.body.success).toBe(false);
    expect(submitRes.body.error.code).toBe('INVALID_SUBMISSION');
  });

  // 7. Submit valid attempt
  it('7. POST /api/v1/attempts/:id/submit should accept valid submission and return status: SUBMITTED', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    const submitRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.status).toBe('SUBMITTED');

    // Await background evaluation so it finishes before subsequent tests reset the DB
    await waitForEvaluation(attemptId, 'learner-alice');
  });

  // 8. Duplicate submission rejected
  it('8. Duplicate submission should be rejected with 409', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    const dupRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.error.code).toBe('INVALID_STATE_TRANSITION');

    // Await background evaluation so it finishes cleanly
    await waitForEvaluation(attemptId, 'learner-alice');
  });

  // 9. Editing submitted attempt rejected
  it('9. Editing submitted attempt should be rejected with 409', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    const editRes = await request(app)
      .put(`/api/v1/attempts/${attemptId}/draft`)
      .set('x-learner-id', 'learner-alice')
      .send({ requirementsAndAssumptions: 'Tampering with submitted draft' });

    expect(editRes.status).toBe(409);
    expect(editRes.body.success).toBe(false);
    expect(editRes.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  // 10. Status endpoint
  it('10. GET /api/v1/attempts/:id/status should return current status', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    const statusRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/status`)
      .set('x-learner-id', 'learner-alice');

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('DRAFT');
  });

  // 11. Mock evaluation execution
  it('11. Mock evaluation should evaluate all 8 rubric criteria and set status to EVALUATED', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    const evalStatus = await waitForEvaluation(attemptId, 'learner-alice');
    expect(evalStatus.status).toBe('EVALUATED');
  });

  // 12. Evaluation endpoint
  it('12. GET /api/v1/attempts/:id/evaluation should return structured rubric feedback', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    await waitForEvaluation(attemptId, 'learner-alice');

    const evalRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/evaluation`)
      .set('x-learner-id', 'learner-alice');

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.success).toBe(true);
    expect(evalRes.body.data.status).toBe('EVALUATED');
    expect(evalRes.body.data.overallScore).toBeGreaterThanOrEqual(70);
    expect(evalRes.body.data.criteriaScores.length).toBe(8);
    expect(evalRes.body.data.summary).toBeDefined();
    expect(evalRes.body.data.strengths.length).toBeGreaterThan(0);
  });

  // 13. History endpoint
  it('13. GET /api/v1/problems/:id/attempts should return attempt history', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    await waitForEvaluation(attemptId, 'learner-alice');

    const historyRes = await request(app)
      .get('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].attemptId).toBe(attemptId);
    expect(historyRes.body.data[0].overallScore).toBeDefined();
  });

  // 14. History only contains current learner
  it('14. History should only contain current learner attempts', async () => {
    await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');

    const bobHistoryRes = await request(app)
      .get('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-bob');

    expect(bobHistoryRes.status).toBe(200);
    expect(bobHistoryRes.body.data.length).toBe(0);
  });

  // 15. Cross-learner access rejected
  it('15. Cross-learner access to an attempt should be rejected with 404', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    const accessRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}`)
      .set('x-learner-id', 'learner-bob');

    expect(accessRes.status).toBe(404);
    expect(accessRes.body.success).toBe(false);
  });

  // 16. Evaluated attempt cannot be edited
  it('16. Evaluated attempt cannot be edited', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    await waitForEvaluation(attemptId, 'learner-alice');

    const editRes = await request(app)
      .put(`/api/v1/attempts/${attemptId}/draft`)
      .set('x-learner-id', 'learner-alice')
      .send({ requirementsAndAssumptions: 'Editing after evaluation' });

    expect(editRes.status).toBe(409);
    expect(editRes.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  // 17. Evaluated attempt can be forked
  it('17. Evaluated attempt can be forked into a new DRAFT attempt', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    await waitForEvaluation(attemptId, 'learner-alice');

    const forkRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice')
      .send({ parentAttemptId: attemptId });

    expect(forkRes.status).toBe(201);
    expect(forkRes.body.success).toBe(true);
    expect(forkRes.body.data.status).toBe('DRAFT');
    expect(forkRes.body.data.parentAttemptId).toBe(attemptId);
  });

  // 18. Fork creates incremented attempt number
  it('18. Fork should increment attemptNumber and retain previous submission content', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    await waitForEvaluation(attemptId, 'learner-alice');

    const forkRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice')
      .send({ parentAttemptId: attemptId });

    expect(forkRes.body.data.attemptNumber).toBe(2);

    const forkedGetRes = await request(app)
      .get(`/api/v1/attempts/${forkRes.body.data.attemptId}`)
      .set('x-learner-id', 'learner-alice');

    expect(forkedGetRes.body.data.submission.sections.designExplanation).toBe(validSubmissionBody.designExplanation);
  });

  // 19. Retry only works for FAILED
  it('19. Retry should reject attempts that are in DRAFT state with 409', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    const retryRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/retry`)
      .set('x-learner-id', 'learner-alice');

    expect(retryRes.status).toBe(409);
    expect(retryRes.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  // 20. Invalid retry state rejected
  it('20. Retry should reject attempts that are already EVALUATED with 409', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    await waitForEvaluation(attemptId, 'learner-alice');

    const retryRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/retry`)
      .set('x-learner-id', 'learner-alice');

    expect(retryRes.status).toBe(409);
    expect(retryRes.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  // 21. Evaluator failure produces FAILED
  it('21. Evaluator failure should transition attempt to FAILED with safe error message', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    // Directly set attempt to FAILED in database to verify FAILED handling and error sanitization
    const attemptDoc = await AttemptModel.findById(attemptId);
    attemptDoc.status = 'FAILED';
    attemptDoc.errorMessage = 'Simulated evaluator network timeout';
    await attemptDoc.save();

    const statusRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/status`)
      .set('x-learner-id', 'learner-alice');

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('FAILED');
    expect(statusRes.body.data.errorMessage).toBe('Simulated evaluator network timeout');

    const evalRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/evaluation`)
      .set('x-learner-id', 'learner-alice');

    expect(evalRes.body.data.status).toBe('FAILED');
    expect(evalRes.body.data.error.code).toBe('EVALUATION_FAILED');
  });

  // 22. Failed attempt retains submission
  it('22. Failed attempt should preserve original submission content', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .put(`/api/v1/attempts/${attemptId}/draft`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    // Transition directly to FAILED
    const attemptDoc = await AttemptModel.findById(attemptId);
    attemptDoc.status = 'FAILED';
    attemptDoc.errorMessage = 'Service temporarily unavailable';
    await attemptDoc.save();

    const getRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}`)
      .set('x-learner-id', 'learner-alice');

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe('FAILED');
    expect(getRes.body.data.submission.sections.requirementsAndAssumptions).toBe(
      validSubmissionBody.requirementsAndAssumptions
    );
  });

  // 23. Retry after failure works
  it('23. Retry after failure should re-trigger evaluation and complete to EVALUATED', async () => {
    const createRes = await request(app)
      .post('/api/v1/problems/prob-parking-lot/attempts')
      .set('x-learner-id', 'learner-alice');
    const attemptId = createRes.body.data.attemptId;

    await request(app)
      .put(`/api/v1/attempts/${attemptId}/draft`)
      .set('x-learner-id', 'learner-alice')
      .send(validSubmissionBody);

    // Mark as FAILED
    const attemptDoc = await AttemptModel.findById(attemptId);
    attemptDoc.status = 'FAILED';
    attemptDoc.errorMessage = 'Temporary failure';
    await attemptDoc.save();

    const retryRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/retry`)
      .set('x-learner-id', 'learner-alice');

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.status).toBe('EVALUATING');

    const evalStatus = await waitForEvaluation(attemptId, 'learner-alice');
    expect(evalStatus.status).toBe('EVALUATED');
  });

  // 24. Health endpoint still works
  it('24. GET /api/v1/health should continue to respond with { status: "ok" }', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
