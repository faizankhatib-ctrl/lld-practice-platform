import mongoose, { Schema } from 'mongoose';

export interface IAttemptDocument {
  _id: string;
  problemId: string;
  learnerId: string;
  attemptNumber: number;
  parentAttemptId: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED' | 'FAILED';
  submissionFormat: 'STRUCTURED_TEXT' | 'DIAGRAM' | 'CODE';
  content: {
    requirementsAndAssumptions: string;
    classesAndResponsibilities: string;
    interfacesAndRelationships: string;
    designExplanation: string;
    tradeoffs: string;
    edgeCases: string;
  };
  submittedAt: Date | null;
  evaluationId: string | null;
  errorMessage: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttemptSchema = new Schema<IAttemptDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    problemId: {
      type: String,
      required: true,
      index: true,
    },
    learnerId: {
      type: String,
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    parentAttemptId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ['DRAFT', 'SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED'],
      default: 'DRAFT',
      index: true,
    },
    submissionFormat: {
      type: String,
      required: true,
      enum: ['STRUCTURED_TEXT', 'DIAGRAM', 'CODE'],
      default: 'STRUCTURED_TEXT',
    },
    content: {
      requirementsAndAssumptions: { type: String, default: '' },
      classesAndResponsibilities: { type: String, default: '' },
      interfacesAndRelationships: { type: String, default: '' },
      designExplanation: { type: String, default: '' },
      tradeoffs: { type: String, default: '' },
      edgeCases: { type: String, default: '' },
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    evaluationId: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

// Compound index for learner's attempts on a specific problem
AttemptSchema.index({ problemId: 1, learnerId: 1, attemptNumber: 1 });

export const AttemptModel =
  mongoose.models.Attempt || mongoose.model<IAttemptDocument>('Attempt', AttemptSchema);
