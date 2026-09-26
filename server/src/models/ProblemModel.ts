import mongoose, { Schema } from 'mongoose';

export interface IProblemDocument {
  _id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedTimeMinutes: number;
  summary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  constraints: string[];
  suggestedPatterns: string[];
  requiredEntities: string[];
  active: boolean;
  rubricConfig: {
    criteriaKeys: string[];
    passingScore: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ProblemSchema = new Schema<IProblemDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['EASY', 'MEDIUM', 'HARD'],
    },
    estimatedTimeMinutes: {
      type: Number,
      required: true,
      default: 45,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    functionalRequirements: {
      type: [String],
      required: true,
      default: [],
    },
    nonFunctionalRequirements: {
      type: [String],
      default: [],
    },
    constraints: {
      type: [String],
      default: [],
    },
    suggestedPatterns: {
      type: [String],
      default: [],
    },
    requiredEntities: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    rubricConfig: {
      criteriaKeys: {
        type: [String],
        default: [],
      },
      passingScore: {
        type: Number,
        default: 70,
      },
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

export const ProblemModel =
  mongoose.models.Problem || mongoose.model<IProblemDocument>('Problem', ProblemSchema);
