export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type AttemptStatus = 'DRAFT' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED' | 'FAILED';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  estimatedTimeMinutes: number;
  summary: string;
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
  constraints?: string[];
  requiredEntities: string[];
  suggestedPatterns: string[];
  rubricCriteria?: string[];
}

export interface StructuredTextSections {
  requirementsAndAssumptions: string;
  classesAndResponsibilities: string;
  interfacesAndRelationships: string;
  designExplanation: string;
  tradeoffs: string;
  edgeCases: string;
}

export interface SubmissionData {
  id: string;
  format: 'STRUCTURED_TEXT';
  sections?: StructuredTextSections;
}

export interface Attempt {
  id: string;
  problemId: string;
  learnerId: string;
  attemptNumber: number;
  parentAttemptId: string | null;
  status: AttemptStatus;
  submission: SubmissionData;
  submittedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CriterionFeedbackItem {
  criterion: string;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: Confidence;
}

export interface EvaluationData {
  status: AttemptStatus;
  overallScore?: number;
  passed?: boolean;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  criteriaScores?: CriterionFeedbackItem[];
  createdAt?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface AttemptStatusData {
  status: AttemptStatus;
  isTerminal: boolean;
  evaluationId?: string | null;
  errorMessage?: string | null;
}

export interface AttemptHistoryItem {
  attemptId: string;
  attemptNumber: number;
  parentAttemptId: string | null;
  status: AttemptStatus;
  overallScore: number | null;
  evaluationSummary: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}
