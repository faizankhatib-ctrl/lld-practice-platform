# Architectural Design Document: LLD Practice Platform

## 1. Architectural Style & Layering

The LLD Practice Platform is structured as a **Clean Modular Monolith** adhering to Domain-Driven Design (DDD) principles. The architecture ensures strict inward dependency rules:

```
[ Frontend: React 18 SPA ]
            │ HTTP / JSON (x-learner-id)
            ▼
[ REST API Transport Layer: Express Controllers + Zod DTOs ]
            │ Calls
            ▼
[ Application Services Layer: ProblemService, AttemptService, EvaluationService ]
            │ Orchestrates
            ├───► [ Domain Layer: Problem, Attempt, Submission, State Machine ] (0 External Deps)
            ├───► [ Repository Interfaces: IProblemRepository, IAttemptRepository, IEvaluationRepository ]
            └───► [ Evaluator Interface: IEvaluator (MockEvaluator, GeminiAiEvaluator) ]
                        │ Persists / Calls
                        ▼
            [ Infrastructure / Persistence: Mongoose Models & MongoDB ]
```

### Layer Responsibilities
1. **Frontend**: Interactive React application providing responsive practice and feedback views.
2. **REST API Transport Layer**: Express controllers validate incoming HTTP request payloads via Zod DTO schemas and map errors to normalized HTTP response envelopes.
3. **Application Services Layer**: Coordinates use-case workflows (creating attempts, auto-saving drafts, dispatching evaluations, retrieving history).
4. **Domain Layer**: Contains the core business entities, value objects, and lifecycle state machines. **The domain layer has zero dependencies** on databases, web frameworks, or AI SDKs.
5. **Infrastructure & Persistence**: Implements repository interfaces using Mongoose and handles external AI communication through the `IEvaluator` strategy.

---

## 2. Core Domain Entities & Value Objects

### 1. `Problem`
Represents an architectural challenge in the catalog.
- **Attributes**: `id`, `slug`, `title`, `difficulty` (`EASY`, `MEDIUM`, `HARD`), `estimatedTimeMinutes`, `summary`, `functionalRequirements[]`, `nonFunctionalRequirements[]`, `constraints[]`, `requiredEntities[]`, `suggestedPatterns[]`, `rubricCriteria[]`.
- **Invariants**: Must contain at least one functional requirement and canonical rubric criteria.

### 2. `Attempt`
An individual candidate session addressing a specific problem.
- **Attributes**: `id`, `problemId`, `learnerId`, `attemptNumber`, `status`, `submission`, `parentAttemptId`, `evaluationId`, `errorMessage`, `createdAt`, `updatedAt`, `submittedAt`.
- **Role**: Serves as the Aggregate Root managing submission edits and lifecycle state transitions.

### 3. `Submission` (Abstract Entity)
Encapsulates a candidate's architectural solution.
- **Concrete Subtype**: `StructuredTextSubmission` containing:
  - `requirementsAndAssumptions`
  - `classesAndResponsibilities`
  - `interfacesAndRelationships`
  - `designExplanation`
  - `tradeoffs`
  - `edgeCases`
- **Validation**: Enforces minimal character lengths across all sections before submission.

### 4. `Evaluation`
The immutable record of architectural assessment.
- **Attributes**: `id`, `attemptId`, `evaluatorType`, `overallScore` (0–100), `passed` (boolean), `summary`, `strengths[]`, `weaknesses[]`, `criteriaScores[]`, `deterministicChecks`.
- **Value Object**: `CriterionScoreItem`:
  - `criterion`: Canonical Rubric Dimension
  - `score`: Numeric score (0–100)
  - `maxScore`: 100
  - `evidence`: Verbatim quote from candidate submission
  - `concern`: Architectural risk or trade-off critique
  - `suggestion`: Actionable advice for improvement
  - `confidence`: `HIGH`, `MEDIUM`, `LOW`

### 5. `ScoreCard`
A computed summary value object representing overall pass/fail status and dimensional score distributions.

---

## 3. Attempt State Machine & Lifecycle Transitions

Attempt state is managed using the **GoF State Pattern** via explicit domain classes (`DraftState`, `SubmittedState`, `EvaluatingState`, `EvaluatedState`, `FailedState`) inheriting from `AttemptState`.

```
                    ┌─────────────────────────┐
                    │          DRAFT          │ ◄─────────────────────────┐
                    └────────────┬────────────┘                           │
                                 │ submit()                               │
                                 ▼                                        │
                    ┌─────────────────────────┐                           │
                    │        SUBMITTED        │                           │
                    └────────────┬────────────┘                           │
                                 │ startEvaluation()                      │
                                 ▼                                        │
                    ┌─────────────────────────┐                           │
                    │       EVALUATING        │                           │
                    └──────┬───────────┬──────┘                           │
                           │           │                                  │
    evaluationSucceeded()  │           │ evaluationFailed()               │
                           ▼           ▼                                  │
              ┌────────────────┐   ┌────────────────┐                     │
              │   EVALUATED    │   │     FAILED     │                     │
              └───────┬────────┘   └───────┬────────┘                     │
                      │                    │ retry()                      │
                      │ fork()             └──────────────► [EVALUATING]  │
                      │                                                   │
                      └───────────────────────────────────────────────────┘
                                   (creates new Attempt #2)
```

### Transition Specifications:
1. **`DRAFT → SUBMITTED`**:
   - Triggered by learner submission. Validates section lengths. Freezes the submission against further direct edits.
2. **`SUBMITTED → EVALUATING`**:
   - Triggered when `EvaluationService` claims the attempt and dispatches it to the `IEvaluator`.
3. **`EVALUATING → EVALUATED`**:
   - Triggered when evaluation completes successfully. Links `evaluationId` to the attempt.
4. **`EVALUATING → FAILED`**:
   - Triggered on unrecoverable external error or timeout. Preserves the submission intact.
5. **`FAILED → EVALUATING` (Retry)**:
   - Allows learners to re-trigger evaluation without losing their entered text.
6. **`EVALUATED → DRAFT` (Fork / Try Again)**:
   - Spawns a brand new `Attempt` entity with `attemptNumber = previous + 1` and `parentAttemptId = previous.id`.
   - Pre-populates the new attempt's draft with the previous submission content so the learner can iterate.

---

## 4. Abstractions & Decoupling

### Repository Abstraction (`IRepository`)
Application services interact with repositories solely through interfaces:
- `IProblemRepository`: `findById()`, `findBySlug()`, `findAll()`
- `IAttemptRepository`: `findById()`, `findByLearnerAndProblem()`, `save()`
- `IEvaluationRepository`: `findById()`, `findByAttemptId()`, `save()`

This allows transparent switching between in-memory MongoDB (for fast local development and testing) and persistent MongoDB clusters without changing business logic.

### Evaluator Abstraction (`IEvaluator`)
```typescript
export interface IEvaluator {
  readonly evaluatorType: string;
  evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult>;
}
```
Two concrete implementations exist:
1. **`MockEvaluator`**: Runs offline, deterministic evaluations with zero latency or external network calls.
2. **`GeminiAiEvaluator`**: Connects to the Google Gemini API with low temperature (`0.2`), strict JSON schema generation, prompt injection guards, and timeout protection.

At startup, `evaluatorFactory.ts` dynamically instantiates the appropriate evaluator based on environment variables (`AI_EVALUATOR_ENABLED` and `GEMINI_API_KEY`). If the API key is missing, the system gracefully falls back to `MockEvaluator`.

---

## 5. Key Extensibility Decisions

### Decision 1: Text Submission Today → Class Diagram Submissions Tomorrow
- **Current State**: Submissions use `StructuredTextSubmission`.
- **Extensibility Design**: `Submission` is an abstract base entity. To support visual UML diagrams or Mermaid code, a new entity `ClassDiagramSubmission` can be added without altering the `Attempt` state machine or persistence contracts.
- **Trade-off**: Text fields are easier for candidates to author quickly during an MVP interview simulation, avoiding the complexity of a full-fledged canvas diagram editor while capturing architectural reasoning.

### Decision 2: Single Evaluator Today → Multi-Evaluator / Human-in-the-Loop Tomorrow
- **Current State**: A single active `IEvaluator` evaluates the submission.
- **Extensibility Design**: The `EvaluationService` interacts with `IEvaluator`. A `CompositeEvaluator` or `ConsensusEvaluator` can be introduced to evaluate submissions concurrently against multiple LLMs (e.g., Gemini, Claude) or route submissions to human mentors.
- **Trade-off**: For the 2-day MVP, a single evaluator keeps latency and cost low while delivering immediate, detailed feedback.
