import { z } from 'zod';

export const SaveDraftSchema = z.object({
  requirementsAndAssumptions: z.string().optional().default(''),
  classesAndResponsibilities: z.string().optional().default(''),
  interfacesAndRelationships: z.string().optional().default(''),
  designExplanation: z.string().optional().default(''),
  tradeoffs: z.string().optional().default(''),
  edgeCases: z.string().optional().default(''),
});

export const SubmitAttemptSchema = z.object({
  requirementsAndAssumptions: z.string({
    required_error: "'requirementsAndAssumptions' is required",
  }),
  classesAndResponsibilities: z.string({
    required_error: "'classesAndResponsibilities' is required",
  }),
  interfacesAndRelationships: z.string({
    required_error: "'interfacesAndRelationships' is required",
  }),
  designExplanation: z.string({
    required_error: "'designExplanation' is required",
  }),
  tradeoffs: z.string({
    required_error: "'tradeoffs' is required",
  }),
  edgeCases: z.string({
    required_error: "'edgeCases' is required",
  }),
});

export const CreateAttemptSchema = z.object({
  parentAttemptId: z.string().optional(),
});

export type SaveDraftDTO = z.infer<typeof SaveDraftSchema>;
export type SubmitAttemptDTO = z.infer<typeof SubmitAttemptSchema>;
export type CreateAttemptDTO = z.infer<typeof CreateAttemptSchema>;
