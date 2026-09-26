import { describe, it, expect } from 'vitest';
import { Problem } from '../../src/domain/entities/Problem.js';
import { StructuredTextSubmission } from '../../src/domain/entities/StructuredTextSubmission.js';
import { RubricCriterion } from '../../src/domain/types/common.types.js';
import { InvalidArgumentError } from '../../src/domain/errors/DomainErrors.js';

describe('Problem Domain Entity', () => {
  const createValidProblem = () =>
    new Problem({
      id: 'prob-1',
      slug: 'parking-lot',
      title: 'Design a Parking Lot',
      difficulty: 'MEDIUM',
      summary: 'Design an automated multi-floor parking lot system.',
      functionalRequirements: [
        'Park a vehicle',
        'Unpark a vehicle and issue bill',
        'Support compact, large, and electric spots',
      ],
      nonFunctionalRequirements: ['Thread-safe allocation', 'Extensible fee strategy'],
      constraints: ['Max 4 floors', '100 spots per floor'],
      requiredEntities: ['ParkingSpot', 'Vehicle', 'Ticket', 'Payment'],
      suggestedPatterns: ['Strategy', 'Factory', 'Singleton'],
    });

  it('should successfully instantiate a valid problem', () => {
    const problem = createValidProblem();
    expect(problem.id).toBe('prob-1');
    expect(problem.slug).toBe('parking-lot');
    expect(problem.difficulty).toBe('MEDIUM');
    expect(problem.functionalRequirements.length).toBe(3);
    expect(problem.requiredEntities).toContain('ParkingSpot');
  });

  it('should throw InvalidArgumentError when required fields are missing', () => {
    expect(
      () =>
        new Problem({
          id: '',
          slug: 'test',
          title: 'Test',
          difficulty: 'EASY',
          summary: 'Summary',
          functionalRequirements: ['Req 1'],
          nonFunctionalRequirements: [],
          constraints: [],
          requiredEntities: [],
          suggestedPatterns: [],
        })
    ).toThrow(InvalidArgumentError);

    expect(
      () =>
        new Problem({
          id: 'p-1',
          slug: '',
          title: 'Test',
          difficulty: 'EASY',
          summary: 'Summary',
          functionalRequirements: ['Req 1'],
          nonFunctionalRequirements: [],
          constraints: [],
          requiredEntities: [],
          suggestedPatterns: [],
        })
    ).toThrow(InvalidArgumentError);

    expect(
      () =>
        new Problem({
          id: 'p-1',
          slug: 'test',
          title: 'Test',
          difficulty: 'EASY',
          summary: 'Summary',
          functionalRequirements: [], // Empty
          nonFunctionalRequirements: [],
          constraints: [],
          requiredEntities: [],
          suggestedPatterns: [],
        })
    ).toThrow(InvalidArgumentError);
  });

  it('should expose all 8 fixed rubric criteria', () => {
    const problem = createValidProblem();
    const criteria = problem.getRubricCriteria();

    expect(criteria.length).toBe(8);
    expect(criteria).toContain(RubricCriterion.REQUIREMENT_UNDERSTANDING);
    expect(criteria).toContain(RubricCriterion.CLASS_RESPONSIBILITIES);
    expect(criteria).toContain(RubricCriterion.COUPLING_COHESION);
    expect(criteria).toContain(RubricCriterion.ENCAPSULATION_INTERFACES);
    expect(criteria).toContain(RubricCriterion.ABSTRACTION_PATTERNS);
    expect(criteria).toContain(RubricCriterion.EXTENSIBILITY);
    expect(criteria).toContain(RubricCriterion.EDGE_CASES_TESTABILITY);
    expect(criteria).toContain(RubricCriterion.EXPLANATION_QUALITY);
  });

  it('should validate submission completeness and warn when required entities are absent', () => {
    const problem = createValidProblem();

    // Submission containing ParkingSpot, Vehicle, Ticket, Payment
    const completeSubmission = new StructuredTextSubmission('sub-1', {
      requirementsAndAssumptions: 'The parking lot supports multiple floors and various vehicle types.',
      classesAndResponsibilities: 'ParkingSpot holds spot status. Vehicle represents car or bike. Ticket tracks entry. Payment calculates dues.',
      interfacesAndRelationships: 'IParkingFeeStrategy defines fee algorithm. ParkingLot has ParkingFloors.',
      designExplanation: 'Used Strategy pattern for dynamic pricing and Factory for spot assignment.',
      tradeoffs: 'In-memory map for spot lookup vs database query latency.',
      edgeCases: 'Concurrency during spot allocation handled with mutex or optimistic lock.',
    });

    const result = problem.validateSubmissionCompleteness(completeSubmission);
    expect(result.isValid).toBe(true);
    expect(result.warnings?.length).toBe(0);

    // Submission missing 'Payment' and 'Ticket'
    const partialSubmission = new StructuredTextSubmission('sub-2', {
      requirementsAndAssumptions: 'The parking lot supports multiple floors and various vehicle types.',
      classesAndResponsibilities: 'ParkingSpot holds spot status. Vehicle represents car or bike.',
      interfacesAndRelationships: 'IParkingFeeStrategy defines fee algorithm. ParkingLot has ParkingFloors.',
      designExplanation: 'Used Strategy pattern for dynamic pricing and Factory for spot assignment.',
      tradeoffs: 'In-memory map for spot lookup vs database query latency.',
      edgeCases: 'Concurrency during spot allocation handled with mutex or optimistic lock.',
    });

    const partialResult = problem.validateSubmissionCompleteness(partialSubmission);
    expect(partialResult.isValid).toBe(true);
    expect(partialResult.warnings?.length).toBeGreaterThan(0);
    expect(partialResult.warnings?.[0]).toContain('Ticket');
  });
});
