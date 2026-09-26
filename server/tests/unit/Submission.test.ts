import { describe, it, expect } from 'vitest';
import { StructuredTextSubmission } from '../../src/domain/entities/StructuredTextSubmission.js';
import { InvalidArgumentError } from '../../src/domain/errors/DomainErrors.js';

describe('StructuredTextSubmission Domain Entity', () => {
  const validSections = {
    requirementsAndAssumptions: 'Clarified that the parking lot has automated gate barriers and cash/card payments.',
    classesAndResponsibilities: 'Vehicle, Car, Bike, ParkingSpot, Ticket, Payment, DisplayBoard, Gate, Floor.',
    interfacesAndRelationships: 'ParkingSpot implements IParkingSpot; IPricingStrategy has HourlyPricingStrategy.',
    designExplanation: 'Strategy pattern handles rate changes; Observer pattern updates the DisplayBoard on vacancy changes.',
    tradeoffs: 'Decided on synchronization per floor rather than global lock to improve ingress throughput.',
    edgeCases: 'Handling full lot scenarios, lost tickets, electric vehicle spot allocation, and simultaneous gate entries.',
  };

  it('should instantiate a valid StructuredTextSubmission', () => {
    const submission = new StructuredTextSubmission('sub-100', validSections);
    expect(submission.id).toBe('sub-100');
    expect(submission.format).toBe('STRUCTURED_TEXT');
    expect(submission.sections.requirementsAndAssumptions).toContain('automated gate');
  });

  it('should throw InvalidArgumentError when submission ID is empty', () => {
    expect(() => new StructuredTextSubmission('', validSections)).toThrow(InvalidArgumentError);
  });

  it('should validate cleanly when all sections satisfy minimum length criteria', () => {
    const submission = new StructuredTextSubmission('sub-101', validSections);
    const result = submission.validate();

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should reject incomplete submissions with specific section errors', () => {
    const incompleteSubmission = new StructuredTextSubmission('sub-102', {
      requirementsAndAssumptions: 'Too short', // < 15 chars
      classesAndResponsibilities: '', // Empty
      interfacesAndRelationships: 'Interfaces are good.',
      designExplanation: '', // Empty
      tradeoffs: 'None', // < 15 chars
      edgeCases: 'Valid long edge case handling explanation for concurrency.',
    });

    const result = incompleteSubmission.validate();
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(4);
    expect(result.errors.some((e) => e.includes('Requirements'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Classes'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Design Explanation'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Trade-offs'))).toBe(true);
  });

  it('should generate properly formatted combined markdown text', () => {
    const submission = new StructuredTextSubmission('sub-103', validSections);
    const combined = submission.getCombinedText();

    expect(combined).toContain('# 1. Requirements & Assumptions');
    expect(combined).toContain('# 2. Classes & Responsibilities');
    expect(combined).toContain('# 3. Interfaces & Relationships');
    expect(combined).toContain('# 4. Design Explanation');
    expect(combined).toContain('# 5. Trade-offs');
    expect(combined).toContain('# 6. Edge Cases & Testability');
    expect(combined).toContain(validSections.designExplanation);
  });

  it('should create an empty draft template with createEmpty factory', () => {
    const emptyDraft = StructuredTextSubmission.createEmpty('draft-1');
    expect(emptyDraft.id).toBe('draft-1');
    expect(emptyDraft.sections.requirementsAndAssumptions).toBe('');
    expect(emptyDraft.validate().isValid).toBe(false);
  });
});
