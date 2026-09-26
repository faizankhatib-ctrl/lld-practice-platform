import { Submission } from './Submission.js';
import { SubmissionId, StructuredTextSections, ValidationResult } from '../types/common.types.js';
import { InvalidArgumentError } from '../errors/DomainErrors.js';

export class StructuredTextSubmission extends Submission {
  public readonly sections: Readonly<StructuredTextSections>;

  constructor(
    id: SubmissionId,
    sections: StructuredTextSections,
    createdAt: Date = new Date()
  ) {
    super(id, 'STRUCTURED_TEXT', createdAt);
    if (!sections) {
      throw new InvalidArgumentError('Sections payload must be provided for structured text submission');
    }
    // Deep clone to ensure immutability
    this.sections = Object.freeze({
      requirementsAndAssumptions: (sections.requirementsAndAssumptions || '').trim(),
      classesAndResponsibilities: (sections.classesAndResponsibilities || '').trim(),
      interfacesAndRelationships: (sections.interfacesAndRelationships || '').trim(),
      designExplanation: (sections.designExplanation || '').trim(),
      tradeoffs: (sections.tradeoffs || '').trim(),
      edgeCases: (sections.edgeCases || '').trim(),
    });
  }

  public validate(): ValidationResult {
    const errors: string[] = [];
    const minLength = 15; // Practical minimum length to avoid empty/trivial dummy submissions

    if (!this.sections.requirementsAndAssumptions || this.sections.requirementsAndAssumptions.length < minLength) {
      errors.push(`'Requirements & Assumptions' must be at least ${minLength} characters.`);
    }

    if (!this.sections.classesAndResponsibilities || this.sections.classesAndResponsibilities.length < minLength) {
      errors.push(`'Classes & Responsibilities' must be at least ${minLength} characters.`);
    }

    if (!this.sections.interfacesAndRelationships || this.sections.interfacesAndRelationships.length < minLength) {
      errors.push(`'Interfaces & Relationships' must be at least ${minLength} characters.`);
    }

    if (!this.sections.designExplanation || this.sections.designExplanation.length < minLength) {
      errors.push(`'Design Explanation' must be at least ${minLength} characters.`);
    }

    if (!this.sections.tradeoffs || this.sections.tradeoffs.length < minLength) {
      errors.push(`'Trade-offs' must be at least ${minLength} characters.`);
    }

    if (!this.sections.edgeCases || this.sections.edgeCases.length < minLength) {
      errors.push(`'Edge Cases & Testability' must be at least ${minLength} characters.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public getCombinedText(): string {
    return [
      '# 1. Requirements & Assumptions',
      this.sections.requirementsAndAssumptions || 'N/A',
      '',
      '# 2. Classes & Responsibilities',
      this.sections.classesAndResponsibilities || 'N/A',
      '',
      '# 3. Interfaces & Relationships',
      this.sections.interfacesAndRelationships || 'N/A',
      '',
      '# 4. Design Explanation',
      this.sections.designExplanation || 'N/A',
      '',
      '# 5. Trade-offs',
      this.sections.tradeoffs || 'N/A',
      '',
      '# 6. Edge Cases & Testability',
      this.sections.edgeCases || 'N/A',
    ].join('\n');
  }

  /**
   * Helper factory to create an empty or initial draft template
   */
  public static createEmpty(id: SubmissionId): StructuredTextSubmission {
    return new StructuredTextSubmission(id, {
      requirementsAndAssumptions: '',
      classesAndResponsibilities: '',
      interfacesAndRelationships: '',
      designExplanation: '',
      tradeoffs: '',
      edgeCases: '',
    });
  }
}
