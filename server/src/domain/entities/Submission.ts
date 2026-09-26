import { SubmissionId, SubmissionFormat, ValidationResult } from '../types/common.types.js';
import { InvalidArgumentError } from '../errors/DomainErrors.js';

export abstract class Submission {
  public readonly id: SubmissionId;
  public readonly format: SubmissionFormat;
  public readonly createdAt: Date;

  constructor(id: SubmissionId, format: SubmissionFormat, createdAt: Date = new Date()) {
    if (!id || id.trim().length === 0) {
      throw new InvalidArgumentError('Submission ID cannot be empty');
    }
    this.id = id;
    this.format = format;
    this.createdAt = createdAt;
  }

  /**
   * Validates whether the submission is complete and ready for evaluation.
   */
  public abstract validate(): ValidationResult;

  /**
   * Returns a normalized textual representation of the entire submission.
   */
  public abstract getCombinedText(): string;
}
