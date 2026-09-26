import { Problem } from '../../domain/entities/Problem.js';
import { Submission } from '../../domain/entities/Submission.js';
import { StructuredTextSubmission } from '../../domain/entities/StructuredTextSubmission.js';
import { RubricCriterion, Confidence } from '../../domain/types/common.types.js';
import {
  IEvaluator,
  EvaluationResult,
  NormalizedCriterionEvaluation,
} from '../../domain/interfaces/IEvaluator.js';

export class MockEvaluator implements IEvaluator {
  public readonly evaluatorType = 'MOCK_DETERMINISTIC';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    const startTime = Date.now();
    const isStructured = submission instanceof StructuredTextSubmission;
    const sections = isStructured
      ? (submission as StructuredTextSubmission).sections
      : {
          requirementsAndAssumptions: '',
          classesAndResponsibilities: '',
          interfacesAndRelationships: '',
          designExplanation: '',
          tradeoffs: '',
          edgeCases: '',
        };

    const combinedLower = submission.getCombinedText().toLowerCase();

    // 1. Deterministic Entity Detection
    const detectedEntities: string[] = [];
    const missingEntities: string[] = [];
    for (const entity of problem.requiredEntities) {
      if (combinedLower.includes(entity.toLowerCase())) {
        detectedEntities.push(entity);
      } else {
        missingEntities.push(entity);
      }
    }

    // 2. Deterministic Pattern Detection
    const patternsDetected: string[] = [];
    const patternKeywords = ['strategy', 'factory', 'observer', 'state', 'singleton', 'command', 'decorator'];
    for (const pat of patternKeywords) {
      if (combinedLower.includes(pat)) {
        patternsDetected.push(pat.charAt(0).toUpperCase() + pat.slice(1));
      }
    }

    // 3. Score each of the 8 criteria deterministically
    const criteriaScores: NormalizedCriterionEvaluation[] = [];

    // Criterion 1: Requirement Understanding
    const reqText = sections.requirementsAndAssumptions;
    const hasAssumptions = reqText.toLowerCase().includes('assum') || reqText.toLowerCase().includes('scope');
    const reqScore = reqText.length > 50 && hasAssumptions ? 9 : reqText.length > 30 ? 7 : 5;
    criteriaScores.push({
      criterion: RubricCriterion.REQUIREMENT_UNDERSTANDING,
      score: reqScore,
      maxScore: 10,
      evidence: reqText.slice(0, 120) + (reqText.length > 120 ? '...' : ''),
      concern: hasAssumptions ? 'None noted.' : 'Assumptions were not explicitly enumerated.',
      suggestion: 'Clarify non-functional constraints and throughput requirements upfront.',
      confidence: 'HIGH',
    });

    // Criterion 2: Class Responsibilities
    const classText = sections.classesAndResponsibilities;
    const entityRatio = problem.requiredEntities.length > 0 
      ? detectedEntities.length / problem.requiredEntities.length 
      : 1;
    const classScore = entityRatio >= 0.75 ? 8 : entityRatio >= 0.5 ? 6 : 4;
    criteriaScores.push({
      criterion: RubricCriterion.CLASS_RESPONSIBILITIES,
      score: classScore,
      maxScore: 10,
      evidence: classText.slice(0, 120) + (classText.length > 120 ? '...' : ''),
      concern: missingEntities.length > 0 
        ? `Missing key domain entities: ${missingEntities.join(', ')}`
        : 'Ensure classes adhere strictly to Single Responsibility.',
      suggestion: 'Split coordinator logic from storage/state management classes.',
      confidence: 'HIGH',
    });

    // Criterion 3: Coupling / Cohesion
    const interfaceText = sections.interfacesAndRelationships;
    const hasDecoupling = interfaceText.toLowerCase().includes('interface') || interfaceText.toLowerCase().includes('decoupl');
    const couplingScore = hasDecoupling ? 8 : 6;
    criteriaScores.push({
      criterion: RubricCriterion.COUPLING_COHESION,
      score: couplingScore,
      maxScore: 10,
      evidence: interfaceText.slice(0, 120) + (interfaceText.length > 120 ? '...' : ''),
      concern: hasDecoupling ? 'None noted.' : 'High direct coupling between concrete classes.',
      suggestion: 'Introduce interface boundaries to decouple callers from implementations.',
      confidence: 'MEDIUM',
    });

    // Criterion 4: Encapsulation / Interfaces
    const hasInterfaces = interfaceText.toLowerCase().includes('interface') || interfaceText.toLowerCase().includes('abstract');
    const encapScore = hasInterfaces ? 8 : 6;
    criteriaScores.push({
      criterion: RubricCriterion.ENCAPSULATION_INTERFACES,
      score: encapScore,
      maxScore: 10,
      evidence: interfaceText.slice(0, 120) + (interfaceText.length > 120 ? '...' : ''),
      concern: hasInterfaces ? 'Ensure internal collections return unmodifiable views.' : 'Concrete classes exposed directly.',
      suggestion: 'Hide internal state using access modifiers and expose minimal public API.',
      confidence: 'HIGH',
    });

    // Criterion 5: Abstraction / Patterns
    const patternScore = patternsDetected.length >= 2 ? 9 : patternsDetected.length >= 1 ? 7 : 5;
    criteriaScores.push({
      criterion: RubricCriterion.ABSTRACTION_PATTERNS,
      score: patternScore,
      maxScore: 10,
      evidence: sections.designExplanation.slice(0, 120) + (sections.designExplanation.length > 120 ? '...' : ''),
      concern: patternsDetected.length === 0 ? 'No standard GoF design patterns explicitly applied.' : 'None noted.',
      suggestion: `Consider applying ${problem.suggestedPatterns.slice(0, 2).join(' or ')}.`,
      confidence: 'HIGH',
    });

    // Criterion 6: Extensibility
    const tradeoffText = sections.tradeoffs;
    const hasExtensibility = tradeoffText.toLowerCase().includes('extend') || tradeoffText.toLowerCase().includes('open') || tradeoffText.toLowerCase().includes('future');
    const extScore = hasExtensibility ? 8 : 7;
    criteriaScores.push({
      criterion: RubricCriterion.EXTENSIBILITY,
      score: extScore,
      maxScore: 10,
      evidence: tradeoffText.slice(0, 120) + (tradeoffText.length > 120 ? '...' : ''),
      concern: 'Check if introducing new variants requires modifying existing classes.',
      suggestion: 'Use the Open-Closed Principle (OCP) via strategy polymorphism.',
      confidence: 'HIGH',
    });

    // Criterion 7: Edge Cases / Testability
    const edgeText = sections.edgeCases;
    const hasEdgeCases = edgeText.toLowerCase().includes('concurr') || edgeText.toLowerCase().includes('null') || edgeText.toLowerCase().includes('lock') || edgeText.toLowerCase().includes('fail');
    const edgeScore = hasEdgeCases ? 8 : 6;
    criteriaScores.push({
      criterion: RubricCriterion.EDGE_CASES_TESTABILITY,
      score: edgeScore,
      maxScore: 10,
      evidence: edgeText.slice(0, 120) + (edgeText.length > 120 ? '...' : ''),
      concern: hasEdgeCases ? 'Validate edge cases with comprehensive unit tests.' : 'Concurrency and capacity bounds were omitted.',
      suggestion: 'Identify failure recovery and thread contention scenarios.',
      confidence: 'HIGH',
    });

    // Criterion 8: Explanation Quality
    const explainText = sections.designExplanation;
    const explainScore = explainText.length > 80 ? 9 : explainText.length > 40 ? 7 : 5;
    criteriaScores.push({
      criterion: RubricCriterion.EXPLANATION_QUALITY,
      score: explainScore,
      maxScore: 10,
      evidence: explainText.slice(0, 120) + (explainText.length > 120 ? '...' : ''),
      concern: explainText.length < 50 ? 'Design explanation is relatively terse.' : 'None noted.',
      suggestion: 'Articulate why particular trade-offs were chosen over alternatives.',
      confidence: 'HIGH',
    });

    // Overall Score Calculation (Normalized 0 to 100)
    const totalEarned = criteriaScores.reduce((acc, c) => acc + c.score, 0);
    const totalMax = criteriaScores.reduce((acc, c) => acc + c.maxScore, 0);
    const overallScore = Math.round((totalEarned / totalMax) * 100);
    const passed = overallScore >= 70;

    const strengths: string[] = [];
    if (detectedEntities.length > 0) strengths.push(`Identified core domain entities: ${detectedEntities.slice(0, 3).join(', ')}`);
    if (patternsDetected.length > 0) strengths.push(`Applied relevant design patterns: ${patternsDetected.join(', ')}`);
    if (hasAssumptions) strengths.push('Clearly established problem scope and operational assumptions');
    if (strengths.length === 0) strengths.push('Structured submission with all required LLD sections');

    const weaknesses: string[] = [];
    if (missingEntities.length > 0) weaknesses.push(`Omitted expected entities: ${missingEntities.join(', ')}`);
    if (patternsDetected.length === 0) weaknesses.push('Missed opportunities to apply standard design patterns');
    if (!hasEdgeCases) weaknesses.push('Limited consideration of concurrency and edge case resilience');
    if (weaknesses.length === 0) weaknesses.push('Further elaboration on runtime trade-offs could strengthen the solution');

    const summary = passed
      ? `Solid Low-Level Design attempt for ${problem.title}. The submission demonstrates thoughtful class structuring and appropriate design abstractions with an overall score of ${overallScore}%.`
      : `The design for ${problem.title} is a helpful start but needs refinement in entity responsibilities and abstraction patterns. Current score is ${overallScore}%.`;

    return {
      overallScore,
      passed,
      summary,
      strengths,
      weaknesses,
      criteriaScores,
      evaluatorType: this.evaluatorType,
      modelName: 'deterministic-rubric-v1',
      durationMs: Date.now() - startTime,
      deterministicChecks: {
        entitiesDetected: detectedEntities,
        missingEntities,
        patternsDetected,
        allSectionsCompleted: isStructured,
      },
    };
  }
}
