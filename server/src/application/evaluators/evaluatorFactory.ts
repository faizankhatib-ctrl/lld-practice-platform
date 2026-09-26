import { IEvaluator } from '../../domain/interfaces/IEvaluator.js';
import { MockEvaluator } from './MockEvaluator.js';
import { GeminiAiEvaluator } from './GeminiAiEvaluator.js';
import { env } from '../../config/env.js';

export function createEvaluator(): IEvaluator {
  if (env.AI_EVALUATOR_ENABLED) {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim().length === 0) {
      console.warn(
        '⚠️ [EvaluatorFactory] AI_EVALUATOR_ENABLED is true, but GEMINI_API_KEY is missing. Safely falling back to MockEvaluator.'
      );
      return new MockEvaluator();
    }

    const model = env.AI_MODEL || env.GEMINI_MODEL || 'gemini-1.5-flash';
    console.log(`🧠 [EvaluatorFactory] Real AI Evaluation Enabled. Using model: ${model}`);
    return new GeminiAiEvaluator({
      apiKey: env.GEMINI_API_KEY,
      model,
    });
  }

  return new MockEvaluator();
}
