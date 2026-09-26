# Low-Level Design (LLD) Practice Platform

A full-stack, deliberate practice platform designed for software engineers to practice Low-Level Design (Object-Oriented Design), submit structured architectural solutions, and receive objective, explainable feedback across an 8-dimension rubric.

---

## 1. Project Overview

The **LLD Practice Platform** provides a dedicated, interview-realistic environment for engineers to master object-oriented architecture. Unlike traditional coding platforms that evaluate algorithmic outputs, this platform evaluates **architectural decisions**, class responsibilities, interface boundaries, design pattern suitability, coupling, cohesion, and concurrency edge cases.

---

## 2. Problem Statement

Engineers preparing for system design and Low-Level Design interviews face critical challenges:
- **No Test Case Feedback**: Unlike DSA (LeetCode), LLD problems have no binary unit tests that can validate open-ended class models.
- **Multiple Valid Approaches**: There is rarely a single "correct" solution; trade-offs dictate whether a Strategy, State, or Factory pattern is appropriate.
- **Delayed or Absent Mentorship**: Obtaining detailed architectural critique from senior engineers is scarce and inconsistent.
- **Unstructured Practice**: Generic chat models suffer from conversational drift, lack scoring consistency, and hallucinate grading criteria.

The LLD Practice Platform bridges this gap with structured design inputs, deterministic validation, an isolated evaluation pipeline, and automated rubric-based feedback.

---

## 3. Key Features

- **Curated Problem Catalog**: Real-world LLD problems with clear functional requirements, non-functional constraints, expected domain entities, and suggested design patterns.
- **Structured 6-Section Practice Studio**: Guides learners through requirements analysis, class responsibilities, interfaces, workflow explanations, trade-offs, and edge cases.
- **Live Debounced Autosave**: Drafts persist automatically to MongoDB as learners type, preventing lost work.
- **Explainable 8-Dimension Rubric**: Objective scoring across 8 canonical LLD criteria with quoted evidence, identified concerns, and actionable suggestions.
- **Iterative Progression (Try Again / Forking)**: Versioned attempt history allowing candidates to fork an earlier attempt, inspect changes, and improve their architectural score over time.
- **Sessionless Learner Identity**: Clean `x-learner-id` header architecture enabling instant, friction-free practice without registration walls.
- **Dual-Engine Evaluation Architecture**: Zero-config deterministic `MockEvaluator` for offline development and fast CI/CD tests, plus `GeminiAiEvaluator` for deep, real-world LLM evaluation.

---

## 4. The Learner Journey

```
Choose Problem → Think / Design → Submit → Get Feedback → Review → Try Again (Iterate)
```

1. **Choose Problem**: Select a challenge from the curated catalog based on difficulty and estimated completion time.
2. **Review Specification**: Understand functional requirements, non-functional requirements, constraints, expected domain entities, and rubric criteria.
3. **Draft Solution**: Author an architectural model across 6 structured sections with live autosave.
4. **Submit for Evaluation**: Lock the attempt and dispatch it to the evaluation pipeline.
5. **Receive Feedback**: Inspect the overall score (Score/100), pass/fail indicator, executive summary, strengths, areas for improvement, and detailed rubric scores.
6. **Iterate via Try Again**: Fork the previous attempt to create Attempt #2, addressing the highlighted architectural concerns to elevate the score.

---

## 5. Architecture Overview

The backend is built as a **Clean Modular Monolith** adhering to Domain-Driven Design (DDD) principles with strict separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 SPA)                  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (x-learner-id)
┌───────────────────────────▼────────────────────────────┐
│                  REST API Controllers                  │
│       (Request Validation, DTO Parsing via Zod)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Application Services                  │
│    (ProblemService, AttemptService, EvaluationService) │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│        Domain Layer         │ │     Evaluator Pipeline │
│ (Pure Entities, State Machine,│ │   (IEvaluator Strategy:│
│  Domain Rules — 0 Deps)     │ │    Mock vs. Gemini AI) │
└─────────────┬───────────────┘ └────────────────────────┘
              │
┌─────────────▼───────────────┐
│     Persistence Layer       │
│  (Mongoose Models & In-Mem  │
│   MongoDB Repositories)     │
└─────────────────────────────┘
```

- **Domain Layer**: 100% pure TypeScript. Contains no dependencies on Express, Mongoose, React, or external SDKs.
- **Attempt State Machine**: State transitions (`DRAFT` → `SUBMITTED` → `EVALUATING` → `EVALUATED` | `FAILED`) are enforced entirely within domain classes.
- **Strategy Pattern for Evaluation**: `IEvaluator` interface decouples the application from specific AI providers.

---

## 6. Tech Stack

- **Frontend**: React 18, Vite, TypeScript, React Router 6, Tailwind CSS, Axios, Lucide React
- **Backend**: Node.js, Express, TypeScript, Mongoose, Zod, dotenv, CORS
- **AI Evaluation**: Google Gemini SDK (`@google/genai`)
- **Testing**: Vitest, Supertest, mongodb-memory-server
- **Development Tooling**: tsx, concurrently

---

## 7. Project Structure

```
lld-practice-platform/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── api/                # API client functions (attempts, problems)
│   │   ├── components/         # Reusable UI components (Navbar, ScoreCard, badges)
│   │   ├── lib/                # API Axios client, learner ID utilities
│   │   ├── pages/              # ProblemsPage, ProblemDetailsPage, PracticePage, FeedbackPage, HistoryPage
│   │   ├── tests/              # Frontend component and integration tests
│   │   └── types/              # TypeScript API contract definitions
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.cjs
│   └── vite.config.ts
├── server/                     # Backend Express Application
│   ├── src/
│   │   ├── application/        # Application services & evaluators
│   │   │   ├── evaluators/     # IEvaluator, MockEvaluator, GeminiAiEvaluator, factory
│   │   │   └── services/       # ProblemService, AttemptService, EvaluationService
│   │   ├── config/             # Environment, database connection, in-memory MongoDB
│   │   ├── controllers/        # Thin REST controllers (Attempt, Problem, Health)
│   │   ├── domain/             # Pure domain entities, value objects, state machine
│   │   ├── dto/                # Zod schemas for input validation
│   │   ├── middleware/         # Learner ID extraction, error handler, logger
│   │   ├── models/             # Mongoose persistence schemas
│   │   ├── repositories/       # Mongo repository implementations
│   │   ├── routes/             # Express route declarations
│   │   ├── seeds/              # Seed data (Parking Lot, Elevator, Vending Machine)
│   │   ├── app.ts              # Express application setup & middleware
│   │   └── server.ts           # Server bootstrap and entry point
│   ├── tests/                  # Unit, repository, API, and evaluator tests
│   ├── package.json
│   └── tsconfig.json
├── package.json                # Root workspace configuration
├── README.md                   # Project overview & documentation
├── RESEARCH.md                 # LLD pedagogy & evaluation research
├── DESIGN.md                   # Architectural design document
├── AI_USAGE.md                 # AI usage disclosure & evaluation engine guide
├── DEMO_GUIDE.md               # Step-by-step evaluator demo guide
└── .env.example                # Example environment variables
```

---

## 8. Local Setup

### Prerequisites
- Node.js v18+ (Node 20+ recommended)
- npm v9+

### Clone & Install
```bash
git clone <repository-url>
cd "LLD Practice Platform"

# Install all dependencies (root, server, and client)
npm install
npm --prefix server install
npm --prefix client install
```

---

## 9. Environment Variables

Create a `server/.env` file or use the root `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database Configuration
# Set USE_IN_MEMORY_DB=true to run without installing an external MongoDB server
MONGODB_URI=mongodb://localhost:27017/lld_practice_platform
USE_IN_MEMORY_DB=true

# Evaluator Configuration
# Defaults to MockEvaluator for local development and testing
AI_EVALUATOR_ENABLED=false
AI_MODEL=gemini-1.5-flash

# Optional: Real Gemini AI Evaluation (requires valid key from Google AI Studio)
GEMINI_API_KEY=
```

---

## 10. How to Start Backend

```bash
# Start backend in development mode (with tsx hot-reloading)
npm --prefix server run dev
```
The server will initialize an in-memory MongoDB instance automatically and listen on `http://localhost:5000`.

---

## 11. How to Start Frontend

```bash
# Start Vite development server
npm --prefix client run dev
```
The frontend will be available at `http://localhost:5173`.

### Or Run Concurrently from Root
```bash
npm run dev
```

---

## 12. How to Seed Problems

The backend auto-seeds the 3 initial problems on startup if the database is empty. To manually trigger or re-seed:
```bash
npm run seed
```
This populates:
1. `parking-lot`: Design a Multi-Floor Parking Lot (Medium, 45 min)
2. `elevator-system`: Design an Elevator Control System (Medium, 45 min)
3. `vending-machine`: Design an Automated Vending Machine (Easy, 30 min)

---

## 13. How to Run Tests

```bash
# Run all tests across server and client
npm test

# Run backend tests only (85 tests)
npm run test:server

# Run frontend tests only (6 tests)
npm run test:client
```
All **91/91 tests** execute in under 6 seconds with zero external database or remote API dependencies.

---

## 14. How to Run Lint & Build

```bash
# Type check both server and client (zero TypeScript errors)
npm run lint

# Build production bundles
npm run build
```

---

## 15. REST API Overview

Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness health check |
| `GET` | `/health/detailed` | Readiness check with database & evaluator state |
| `GET` | `/problems` | List all curated LLD problems |
| `GET` | `/problems/:idOrSlug` | Get problem specification and rubric criteria |
| `POST` | `/problems/:idOrSlug/attempts` | Create a new attempt (or fork via `{ parentAttemptId }`) |
| `GET` | `/problems/:idOrSlug/attempts` | List attempt history for the requesting learner |
| `GET` | `/attempts/:id` | Fetch attempt state and draft content |
| `PUT` | `/attempts/:id/draft` | Debounced autosave (valid only in `DRAFT` status) |
| `POST` | `/attempts/:id/submit` | Submit attempt for evaluation |
| `GET` | `/attempts/:id/status` | Poll attempt state machine status |
| `GET` | `/attempts/:id/evaluation` | Retrieve complete 8-dimension rubric feedback |
| `POST` | `/attempts/:id/retry` | Retry evaluation (valid only in `FAILED` status) |

All requests accept the `x-learner-id` header to isolate learner attempts.

---

## 16. Evaluation Flow

```
[Candidate Submits]
         │
         ▼
[Attempt transitions to SUBMITTED]
         │
         ▼
[EvaluationService dispatches to IEvaluator]
         │
         ├───► MockEvaluator (Fast local/test mode)
         │
         └───► GeminiAiEvaluator (Real AI with Gemini 1.5 Flash)
                     │
                     ▼
         [Strict JSON Output Parsed via Zod]
                     │
                     ▼
         [Application enforces score calculations & criteria count]
                     │
                     ▼
[Attempt transitions to EVALUATED] (or FAILED if unrecoverable)
```

The 8 canonical rubric dimensions evaluated are:
1. **Requirement Understanding** (Scope, assumptions, constraints)
2. **Class Responsibilities** (SRP, cohesive responsibilities)
3. **Coupling / Cohesion** (Loose coupling, interface boundaries)
4. **Encapsulation / Interfaces** (Information hiding, public API design)
5. **Abstraction / Patterns** (Appropriate design pattern application)
6. **Extensibility** (OCP, ability to accommodate future requirements)
7. **Edge Cases / Testability** (Concurrency, race conditions, failure recovery)
8. **Explanation Quality** (Clarity of trade-offs and design rationale)

---

## 17. Key Engineering Decisions

1. **Clean Domain Independence**: The domain layer (`server/src/domain`) has zero dependencies on frameworks, databases, or AI SDKs.
2. **Deterministic Score Authority**: While the AI assesses qualitative performance per criterion, the application layer computes the overall score and pass/fail thresholds deterministically to eliminate arithmetic hallucinations.
3. **Resilient Dual-Mode Evaluation**: Developers can run and test the entire platform without an active internet connection or Gemini API key.
4. **Sessionless Learner Identification**: Uses an `x-learner-id` header persisted in `localStorage`. This avoids authentication complexity for a 2-day MVP while preserving multi-learner isolation.

---

## 18. Known Limitations

- **Structured Text vs. Visual Diagrams**: Submissions currently take structured markdown/text rather than interactive UML canvas diagrams.
- **Static Seed Catalog**: Problems are seeded via code scripts rather than an administrative management portal.
- **Asynchronous Polling vs. WebSockets**: The client polls the evaluation status every 2 seconds instead of using WebSockets or Server-Sent Events (SSE).

---

## 19. Future Improvements

- **Interactive UML Diagramming**: Support Mermaid.js or canvas-based class and sequence diagram submissions.
- **Multi-Evaluator Consensus**: Parallel evaluation using multiple models (e.g., Gemini + Claude) with ensemble scoring.
- **Rich Diff Viewer**: Visual side-by-side diff comparing Attempt #1 and Attempt #2 to show architectural evolution directly.
- **Community Rubric Calibration**: Allow senior engineering mentors to review AI-generated feedback and calibrate rubric weights.
