import mongoose, { Schema } from 'mongoose';

export interface ICriterionScoreDocument {
  criterionKey: string;
  criterionName: string;
  score: number;
  maxScore: number;
  weight: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface IEvaluationDocument {
  _id: string;
  attemptId: string;
  problemId: string;
  evaluatorType: string;
  evaluatorModel?: string;
  overallScore: number;
  passed: boolean;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  criteriaScores: ICriterionScoreDocument[];
  deterministicChecks: Record<string, any>;
  durationMs: number;
  createdAt?: Date;
}

const CriterionScoreSchema = new Schema<ICriterionScoreDocument>(
  {
    criterionKey: { type: String, required: true },
    criterionName: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    weight: { type: Number, default: 1 },
    evidence: { type: String, default: '' },
    concern: { type: String, default: '' },
    suggestion: { type: String, default: '' },
    confidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
  },
  { _id: false }
);

const EvaluationSchema = new Schema<IEvaluationDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    attemptId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    problemId: {
      type: String,
      required: true,
      index: true,
    },
    evaluatorType: {
      type: String,
      required: true,
      default: 'MOCK',
    },
    evaluatorModel: {
      type: String,
      default: null,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    criteriaScores: {
      type: [CriterionScoreSchema],
      required: true,
      default: [],
    },
    deterministicChecks: {
      type: Schema.Types.Mixed,
      default: {},
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const EvaluationModel =
  mongoose.models.Evaluation ||
  mongoose.model<IEvaluationDocument>('Evaluation', EvaluationSchema);
