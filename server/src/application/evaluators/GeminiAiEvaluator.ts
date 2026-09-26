import { GoogleGenAI } from '@google/genai';
import { Problem } from '../../domain/entities/Problem.js';
import { Submission } from '../../domain/entities/Submission.js';
import { StructuredTextSubmission } from '../../domain/entities/StructuredTextSubmission.js';
import { Confidence, RubricCriterion } from '../../domain/types/common.types.js';
import {
  IEvaluator,
  EvaluationResult,
  NormalizedCriterionEvaluation,
} from '../../domain/interfaces/IEvaluator.js';
import { buildAiEvaluationPrompt } from './aiPromptBuilder.js';
import { AiEvaluationResponseSchema } from './aiEvaluationSchema.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface GeminiAiEvaluatorOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  aiClient?: any;
}

export class GeminiAiEvaluator implements IEvaluator {
  public readonly evaluatorType = 'AI_GEMINI';
  private readonly aiClient: GoogleGenAI;
  private readonly modelName: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiAiEvaluatorOptions) {
    if (!options.apiKey || options.apiKey.trim().length === 0) {
      throw new AppError('GEMINI_API_KEY is required to initialize GeminiAiEvaluator', 500, 'MISSING_API_KEY');
    }
    this.aiClient = options.aiClient || new GoogleGenAI({ apiKey: options.apiKey.trim() });
    this.modelName = options.model || 'gemini-1.5-flash';
    this.timeoutMs = options.timeoutMs || 25000;
  }

  public async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    const startTime = Date.now();

    // 1. Run deterministic checks outside the LLM
    const combinedLower = submission.getCombinedText().toLowerCase();
    const detectedEntities = problem.requiredEntities.filter((e) =>
      combinedLower.includes(e.toLowerCase())
    );
    const missingEntities = problem.requiredEntities.filter(
      (e) => !combinedLower.includes(e.toLowerCase())
    );
    const deterministicChecks = {
      detectedEntities,
      missingEntities,
      sectionsPresent: submission instanceof StructuredTextSubmission,
    };

    // 2. Build structured prompt with injection defense
    const prompt = buildAiEvaluationPrompt(problem, submission);

    // 3. Invoke Gemini API with timeout protection
    let rawText = '';
    try {
      const generatePromise = this.aiClient.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for consistent, objective evaluation
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini evaluation timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      rawText = response.text || '';
    } catch (err: any) {
      const isTimeout = err?.message?.includes('timed out');
      const safeErrorMsg = isTimeout
        ? 'AI evaluation request timed out'
        : 'AI service temporarily unavailable. Please retry.';
      console.error('[GeminiAiEvaluator] API Call Failure:', isTimeout ? 'Timeout' : 'Service Error');
      throw new AppError(
        safeErrorMsg,
        500,
        'AI_EVALUATION_FAILED'
      );
    }

    // 4. Safe JSON Extraction
    let parsedJson: any;
    try {
      // In case response contains markdown code fences ```json ... ```
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/g, '')
        .trim();
      parsedJson = JSON.parse(cleaned);
    } catch (err) {
      console.error('[GeminiAiEvaluator] JSON Parse Failure. Raw response was:', rawText.slice(0, 300));
      throw new AppError(
        'AI evaluator returned invalid or malformed JSON',
        500,
        'AI_MALFORMED_OUTPUT'
      );
    }

    // 5. Schema Validation via Zod
    const validationResult = AiEvaluationResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      console.error(
        '[GeminiAiEvaluator] Schema Validation Error:',
        JSON.stringify(validationResult.error.format())
      );
      throw new AppError(
        `AI evaluation response did not meet schema requirements: ${validationResult.error.message}`,
        500,
        'AI_VALIDATION_ERROR'
      );
    }

    const aiData = validationResult.data;

    // 6. Deterministic Score & Passing Calculation (Application Layer Control)
    // Do NOT blindly trust the LLM overall score; compute sum(criteria scores) / 8
    const totalScore = aiData.criteriaScores.reduce((sum, c) => sum + c.score, 0);
    const calculatedOverallScore = Math.round(totalScore / 8);
    const calculatedPassed = calculatedOverallScore >= 70;

    // 7. Map criteria confidence and structure
    const mappedCriteriaScores: NormalizedCriterionEvaluation[] = aiData.criteriaScores.map((c) => {
      let confidenceLevel: Confidence = 'HIGH';
      if (c.confidence < 0.4) {
        confidenceLevel = 'LOW';
      } else if (c.confidence < 0.75) {
        confidenceLevel = 'MEDIUM';
      }

      return {
        criterion: c.criterion as RubricCriterion,
        score: c.score,
        maxScore: 100,
        evidence: c.evidence,
        concern: c.concern,
        suggestion: c.suggestion,
        confidence: confidenceLevel,
      };
    });

    return {
      overallScore: calculatedOverallScore,
      passed: calculatedPassed,
      summary: aiData.summary,
      strengths: aiData.strengths.length > 0 ? aiData.strengths : ['Design satisfies core problem constraints'],
      weaknesses: aiData.weaknesses,
      criteriaScores: mappedCriteriaScores,
      evaluatorType: this.evaluatorType,
      modelName: this.modelName,
      durationMs: Date.now() - startTime,
      deterministicChecks,
    };
  }
}
