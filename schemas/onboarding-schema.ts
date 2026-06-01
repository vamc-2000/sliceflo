// schemas/onboarding-schema.ts
import { z } from 'zod';

export const questionnaireResponseSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string(),
  skipped: z.boolean().optional().default(false),
});

export const updateQuestionsRequestSchema = z.object({
  questions: z.record(z.string(), z.any()),
  isQuestionnaireCompleted: z.boolean().optional(),
});

export const completeQuestionnaireRequestSchema = z.object({
  responses: z.array(questionnaireResponseSchema),
  status: z.literal('completed'),
  completedAt: z.string(),
});

// Type inference
export type QuestionnaireResponseData = z.infer<typeof questionnaireResponseSchema>;
export type UpdateQuestionsRequest = z.infer<typeof updateQuestionsRequestSchema>;
export type CompleteQuestionnaireRequest = z.infer<typeof completeQuestionnaireRequestSchema>;
