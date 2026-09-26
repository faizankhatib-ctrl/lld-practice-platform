export type ProblemId = string;
export type AttemptId = string;
export type SubmissionId = string;
export type EvaluationId = string;
export type LearnerId = string;

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type SubmissionFormat = 'STRUCTURED_TEXT' | 'DIAGRAM' | 'CODE';

export enum RubricCriterion {
  REQUIREMENT_UNDERSTANDING = 'Requirement Understanding',
  CLASS_RESPONSIBILITIES = 'Class Responsibilities',
  COUPLING_COHESION = 'Coupling / Cohesion',
  ENCAPSULATION_INTERFACES = 'Encapsulation / Interfaces',
  ABSTRACTION_PATTERNS = 'Abstraction / Patterns',
  EXTENSIBILITY = 'Extensibility',
  EDGE_CASES_TESTABILITY = 'Edge Cases / Testability',
  EXPLANATION_QUALITY = 'Explanation Quality',
}

export interface CriterionResult {
  criterion: RubricCriterion;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: Confidence;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface StructuredTextSections {
  requirementsAndAssumptions: string;
  classesAndResponsibilities: string;
  interfacesAndRelationships: string;
  designExplanation: string;
  tradeoffs: string;
  edgeCases: string;
}
