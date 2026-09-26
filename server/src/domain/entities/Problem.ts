import { ProblemId, Difficulty, RubricCriterion, ValidationResult } from '../types/common.types.js';
import { Submission } from './Submission.js';
import { InvalidArgumentError } from '../errors/DomainErrors.js';

export interface ProblemProps {
  id: ProblemId;
  slug: string;
  title: string;
  difficulty: Difficulty;
  estimatedTimeMinutes?: number;
  summary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  constraints: string[];
  requiredEntities: string[];
  suggestedPatterns: string[];
}

export class Problem {
  public readonly id: ProblemId;
  public readonly slug: string;
  public readonly title: string;
  public readonly difficulty: Difficulty;
  public readonly estimatedTimeMinutes: number;
  public readonly summary: string;
  public readonly functionalRequirements: ReadonlyArray<string>;
  public readonly nonFunctionalRequirements: ReadonlyArray<string>;
  public readonly constraints: ReadonlyArray<string>;
  public readonly requiredEntities: ReadonlyArray<string>;
  public readonly suggestedPatterns: ReadonlyArray<string>;

  constructor(props: ProblemProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new InvalidArgumentError('Problem id is required');
    }
    if (!props.slug || props.slug.trim().length === 0) {
      throw new InvalidArgumentError('Problem slug is required');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidArgumentError('Problem title is required');
    }
    if (!props.summary || props.summary.trim().length === 0) {
      throw new InvalidArgumentError('Problem summary is required');
    }
    if (!props.functionalRequirements || props.functionalRequirements.length === 0) {
      throw new InvalidArgumentError('Problem must have at least one functional requirement');
    }

    this.id = props.id;
    this.slug = props.slug;
    this.title = props.title;
    this.difficulty = props.difficulty;
    this.estimatedTimeMinutes = props.estimatedTimeMinutes || 45;
    this.summary = props.summary;
    this.functionalRequirements = Object.freeze([...props.functionalRequirements]);
    this.nonFunctionalRequirements = Object.freeze([...(props.nonFunctionalRequirements || [])]);
    this.constraints = Object.freeze([...(props.constraints || [])]);
    this.requiredEntities = Object.freeze([...(props.requiredEntities || [])]);
    this.suggestedPatterns = Object.freeze([...(props.suggestedPatterns || [])]);
  }

  /**
   * Returns all 8 canonical rubric criteria that every LLD problem is evaluated on.
   */
  public getRubricCriteria(): RubricCriterion[] {
    return [
      RubricCriterion.REQUIREMENT_UNDERSTANDING,
      RubricCriterion.CLASS_RESPONSIBILITIES,
      RubricCriterion.COUPLING_COHESION,
      RubricCriterion.ENCAPSULATION_INTERFACES,
      RubricCriterion.ABSTRACTION_PATTERNS,
      RubricCriterion.EXTENSIBILITY,
      RubricCriterion.EDGE_CASES_TESTABILITY,
      RubricCriterion.EXPLANATION_QUALITY,
    ];
  }

  /**
   * Validates whether a submission meets problem-specific structural checks
   * (e.g. checking whether required core entities are mentioned in the design).
   */
  public validateSubmissionCompleteness(submission: Submission): ValidationResult {
    const baseValidation = submission.validate();
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const text = submission.getCombinedText().toLowerCase();
    const missingEntities: string[] = [];

    for (const entity of this.requiredEntities) {
      if (!text.includes(entity.toLowerCase())) {
        missingEntities.push(entity);
      }
    }

    const warnings: string[] = [];
    if (missingEntities.length > 0) {
      warnings.push(
        `Submission might be missing key domain entities: ${missingEntities.join(', ')}`
      );
    }

    return {
      isValid: true,
      errors: [],
      warnings,
    };
  }
}
