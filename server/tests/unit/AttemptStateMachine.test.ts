import { describe, it, expect } from 'vitest';
import { Attempt } from '../../src/domain/entities/Attempt.js';
import { StructuredTextSubmission } from '../../src/domain/entities/StructuredTextSubmission.js';
import {
  InvalidStateTransitionError,
  InvalidSubmissionError,
} from '../../src/domain/errors/DomainErrors.js';

describe('Attempt Aggregate & State Machine Lifecycle', () => {
  const validSections = {
    requirementsAndAssumptions: 'Clarified requirements and functional scope with assumption on slot allocation.',
    classesAndResponsibilities: 'ParkingSpot, Vehicle, Car, Bike, Ticket, Payment, ParkingLot, Floor, Gate.',
    interfacesAndRelationships: 'IParkingFeeStrategy, IDisplayBoard. ParkingLot composed of ParkingFloors.',
    designExplanation: 'Strategy pattern for fee calculation. Factory pattern for spot selection.',
    tradeoffs: 'Optimistic locking on spot status vs synchronized floor method to minimize latency.',
    edgeCases: 'Handling full lot, spot contention, lost tickets, overtime charging, and power failure.',
  };

  const createDraftAttempt = (isComplete = true) => {
    const sub = isComplete
      ? new StructuredTextSubmission('sub-1', validSections)
      : StructuredTextSubmission.createEmpty('sub-empty');

    return Attempt.createNew('att-1', 'prob-1', 'learner-100', sub);
  };

  describe('Happy Path State Transitions', () => {
    it('should initialize in DRAFT state and allow saving drafts', () => {
      const attempt = createDraftAttempt(false);
      expect(attempt.status).toBe('DRAFT');

      // Update draft content
      const updatedSub = new StructuredTextSubmission('sub-draft-2', {
        ...validSections,
        requirementsAndAssumptions: 'Updated requirements note for multiple gates.',
      });

      attempt.saveDraft(updatedSub);
      expect(attempt.status).toBe('DRAFT');
      expect(attempt.submission.getCombinedText()).toContain('Updated requirements note');
    });

    it('should transition from DRAFT to SUBMITTED when solution is complete', () => {
      const attempt = createDraftAttempt(true);
      expect(attempt.status).toBe('DRAFT');

      attempt.submit();
      expect(attempt.status).toBe('SUBMITTED');
      expect(attempt.submittedAt).toBeInstanceOf(Date);
    });

    it('should transition from SUBMITTED to EVALUATING', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();

      attempt.startEvaluation();
      expect(attempt.status).toBe('EVALUATING');
    });

    it('should transition from EVALUATING to EVALUATED with evaluationId', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();

      attempt.completeEvaluation('eval-999');
      expect(attempt.status).toBe('EVALUATED');
      expect(attempt.evaluationId).toBe('eval-999');
      expect(attempt.errorMessage).toBeNull();
    });

    it('should transition from EVALUATING to FAILED with error message', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();

      attempt.failEvaluation('Gemini API rate limit exceeded');
      expect(attempt.status).toBe('FAILED');
      expect(attempt.errorMessage).toBe('Gemini API rate limit exceeded');
    });

    it('should allow retry from FAILED back to EVALUATING', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();
      attempt.failEvaluation('Network timeout');
      expect(attempt.status).toBe('FAILED');

      attempt.retryEvaluation();
      expect(attempt.status).toBe('EVALUATING');
      expect(attempt.errorMessage).toBeNull();
    });

    it('should fork an EVALUATED attempt into a new DRAFT attempt with incremented attempt number', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();
      attempt.completeEvaluation('eval-1');
      expect(attempt.status).toBe('EVALUATED');

      const forked = attempt.fork('att-2');

      // Check new attempt
      expect(forked.id).toBe('att-2');
      expect(forked.problemId).toBe(attempt.problemId);
      expect(forked.learnerId).toBe(attempt.learnerId);
      expect(forked.attemptNumber).toBe(2);
      expect(forked.parentAttemptId).toBe('att-1');
      expect(forked.status).toBe('DRAFT');
      expect(forked.evaluationId).toBeNull();
      expect(forked.submission.getCombinedText()).toBe(attempt.submission.getCombinedText());

      // Original attempt remains unchanged
      expect(attempt.status).toBe('EVALUATED');
      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.evaluationId).toBe('eval-1');
    });
  });

  describe('Invalid State Transitions and Guards', () => {
    it('should prevent submitting an incomplete solution from DRAFT', () => {
      const incompleteAttempt = createDraftAttempt(false);
      expect(() => incompleteAttempt.submit()).toThrow(InvalidSubmissionError);
      expect(incompleteAttempt.status).toBe('DRAFT');
    });

    it('should prevent DRAFT -> EVALUATED', () => {
      const attempt = createDraftAttempt(true);
      expect(() => attempt.completeEvaluation('eval-1')).toThrow(InvalidStateTransitionError);
    });

    it('should prevent DRAFT -> FAILED', () => {
      const attempt = createDraftAttempt(true);
      expect(() => attempt.failEvaluation('some error')).toThrow(InvalidStateTransitionError);
    });

    it('should prevent SUBMITTED -> DRAFT (modifying submitted attempt)', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();

      const newSub = new StructuredTextSubmission('sub-tamper', validSections);
      expect(() => attempt.saveDraft(newSub)).toThrow(InvalidStateTransitionError);
      expect(() => attempt.submit()).toThrow(InvalidStateTransitionError);
    });

    it('should prevent EVALUATING -> SUBMITTED or saveDraft', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();

      expect(() => attempt.submit()).toThrow(InvalidStateTransitionError);
      expect(() => attempt.saveDraft(attempt.submission)).toThrow(InvalidStateTransitionError);
    });

    it('should prevent EVALUATED -> SUBMITTED, EVALUATING, or saveDraft (strict immutability)', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();
      attempt.completeEvaluation('eval-done');

      expect(() => attempt.submit()).toThrow(InvalidStateTransitionError);
      expect(() => attempt.startEvaluation()).toThrow(InvalidStateTransitionError);
      expect(() => attempt.saveDraft(attempt.submission)).toThrow(InvalidStateTransitionError);
      expect(() => attempt.failEvaluation('fail')).toThrow(InvalidStateTransitionError);
      expect(() => attempt.retryEvaluation()).toThrow(InvalidStateTransitionError);
    });

    it('should prevent FAILED -> SUBMITTED (only retry is allowed)', () => {
      const attempt = createDraftAttempt(true);
      attempt.submit();
      attempt.startEvaluation();
      attempt.failEvaluation('error');

      expect(() => attempt.submit()).toThrow(InvalidStateTransitionError);
      expect(() => attempt.saveDraft(attempt.submission)).toThrow(InvalidStateTransitionError);
      expect(() => attempt.completeEvaluation('eval-invalid')).toThrow(InvalidStateTransitionError);
    });

    it('should prevent forking an attempt that is not yet EVALUATED', () => {
      const draft = createDraftAttempt(true);
      expect(() => draft.fork('att-next')).toThrow(InvalidStateTransitionError);

      draft.submit();
      expect(() => draft.fork('att-next')).toThrow(InvalidStateTransitionError);
    });
  });
});
