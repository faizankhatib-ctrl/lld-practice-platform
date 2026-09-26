import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { AttemptRepository } from '../../src/repositories/AttemptRepository.js';
import { AttemptModel } from '../../src/models/AttemptModel.js';
import { Attempt } from '../../src/domain/entities/Attempt.js';
import { StructuredTextSubmission } from '../../src/domain/entities/StructuredTextSubmission.js';

describe('AttemptRepository Integration Tests', () => {
  let repository: AttemptRepository;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.USE_IN_MEMORY_DB = 'true';
    await connectDatabase();
    repository = new AttemptRepository();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await AttemptModel.deleteMany({});
  });

  const validSections = {
    requirementsAndAssumptions: 'Clarified requirements and functional scope with assumption on slot allocation.',
    classesAndResponsibilities: 'ParkingSpot, Vehicle, Car, Bike, Ticket, Payment, ParkingLot, Floor, Gate.',
    interfacesAndRelationships: 'IParkingFeeStrategy, IDisplayBoard. ParkingLot composed of ParkingFloors.',
    designExplanation: 'Strategy pattern for fee calculation. Factory pattern for spot selection.',
    tradeoffs: 'Optimistic locking on spot status vs synchronized floor method to minimize latency.',
    edgeCases: 'Handling full lot, spot contention, lost tickets, overtime charging, and power failure.',
  };

  it('should save and find an attempt by ID, preserving state and sections', async () => {
    const submission = new StructuredTextSubmission('sub-1', validSections);
    const attempt = Attempt.createNew('att-1', 'prob-parking', 'learner-1', submission);
    await repository.save(attempt);

    const retrieved = await repository.findById('att-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved).toBeInstanceOf(Attempt);
    expect(retrieved?.id).toBe('att-1');
    expect(retrieved?.problemId).toBe('prob-parking');
    expect(retrieved?.learnerId).toBe('learner-1');
    expect(retrieved?.status).toBe('DRAFT');
    expect(retrieved?.attemptNumber).toBe(1);
    expect(retrieved?.submission).toBeInstanceOf(StructuredTextSubmission);

    const sub = retrieved?.submission as StructuredTextSubmission;
    expect(sub.sections.designExplanation).toBe(validSections.designExplanation);
    expect(sub.sections.tradeoffs).toBe(validSections.tradeoffs);
  });

  it('should preserve state transitions when saved', async () => {
    const submission = new StructuredTextSubmission('sub-2', validSections);
    const attempt = Attempt.createNew('att-2', 'prob-parking', 'learner-1', submission);

    // Transition to SUBMITTED -> EVALUATING -> EVALUATED
    attempt.submit();
    attempt.startEvaluation();
    attempt.completeEvaluation('eval-123');

    await repository.save(attempt);

    const retrieved = await repository.findById('att-2');
    expect(retrieved?.status).toBe('EVALUATED');
    expect(retrieved?.evaluationId).toBe('eval-123');
    expect(retrieved?.submittedAt).toBeInstanceOf(Date);
  });

  it('should find all attempts for a given problem and learner ordered by attemptNumber', async () => {
    const sub1 = new StructuredTextSubmission('sub-3a', validSections);
    const att1 = Attempt.createNew('att-3a', 'prob-parking', 'learner-alice', sub1);
    att1.submit();
    att1.startEvaluation();
    att1.completeEvaluation('eval-1');
    await repository.save(att1);

    const att2 = att1.fork('att-3b');
    await repository.save(att2);

    const attempts = await repository.findByProblemAndLearner('prob-parking', 'learner-alice');
    expect(attempts.length).toBe(2);
    expect(attempts[0].attemptNumber).toBe(1);
    expect(attempts[0].id).toBe('att-3a');
    expect(attempts[1].attemptNumber).toBe(2);
    expect(attempts[1].id).toBe('att-3b');
    expect(attempts[1].parentAttemptId).toBe('att-3a');
  });

  it('should find the latest attempt for a problem and learner', async () => {
    const sub1 = new StructuredTextSubmission('sub-4a', validSections);
    const att1 = Attempt.createNew('att-4a', 'prob-parking', 'learner-bob', sub1);
    att1.submit();
    att1.startEvaluation();
    att1.completeEvaluation('eval-bob-1');
    await repository.save(att1);

    const att2 = att1.fork('att-4b');
    await repository.save(att2);

    const latest = await repository.findLatestAttempt('prob-parking', 'learner-bob');
    expect(latest).not.toBeNull();
    expect(latest?.id).toBe('att-4b');
    expect(latest?.attemptNumber).toBe(2);
  });

  it('should count attempts for a problem and learner correctly', async () => {
    const sub = new StructuredTextSubmission('sub-5', validSections);
    const att1 = Attempt.createNew('att-5a', 'prob-elevator', 'learner-charlie', sub);
    await repository.save(att1);

    const count1 = await repository.countByProblemAndLearner('prob-elevator', 'learner-charlie');
    expect(count1).toBe(1);

    const countNonExistent = await repository.countByProblemAndLearner('prob-elevator', 'non-existent');
    expect(countNonExistent).toBe(0);
  });
});
