# Evaluator Demo Guide: LLD Practice Platform

A concise, step-by-step walkthrough for evaluating and presenting the LLD Practice Platform.

---

## Part 1: Quick-Start Instructions

### Step 1: Start Backend Server
```bash
npm --prefix server run dev
```
*The backend initializes an in-memory MongoDB database and listens on `http://localhost:5000`.*

### Step 2: Start Frontend Server
```bash
npm --prefix client run dev
```
*The frontend starts on `http://localhost:5173`.*

*(Alternative: Run `npm run dev` from the root directory to launch both concurrently.)*

---

## Part 2: Step-by-Step Demo Walkthrough

1. **Open the Application**:
   Navigate to `http://localhost:5173/problems` in your browser.
2. **Review Problem Catalog**:
   Observe the 3 curated LLD problems (*Parking Lot*, *Elevator System*, and *Vending Machine*) showing difficulty badges, estimated completion times, core entities, and suggested design patterns.
3. **Select Vending Machine**:
   Click **"View Problem"** on the *"Design an Automated Vending Machine"* card.
4. **Inspect Problem Specification**:
   Notice the clear separation of Functional Requirements, Non-Functional Requirements, System Constraints, Expected Entities, and the 8-Dimension Rubric.
5. **Start Practice Session**:
   Click **"Start Practice Session"** to create Attempt #1 (`DRAFT` status).
6. **Fill the Six Structured Sections**:
   Enter architectural details across the 6 sections:
   - **1. Requirements & Assumptions**: Scope, denominations, out-of-stock behavior.
   - **2. Classes & Responsibilities**: `VendingMachine`, `IVendingState`, `Inventory`, `Product`, `CoinVault`.
   - **3. Interfaces & Relationships**: State interface, class composition.
   - **4. Design Explanation**: Workflow and State Pattern transitions.
   - **5. Trade-offs**: State Pattern vs. nested switch flags.
   - **6. Edge Cases & Testability**: Concurrent coin insertion and exact change shortfall.
7. **Observe Live Autosave**:
   Notice the autosave indicator showing `"Saving..."` and transition to `"Saved"` without manual saving.
8. **Submit Solution**:
   Click **"Submit Solution"** in the sticky bottom bar, review the confirmation dialog, and click **"Confirm & Submit"**.
9. **Observe Evaluation Polling**:
   The status transitions to `SUBMITTED` → `EVALUATING` with a loading animation.
10. **Review 8-Dimension Feedback**:
    - **Overall Score**: Inspect the overall score (e.g., `78/100`) and pass/fail indicator.
    - **Executive Summary & Bulleted Highlights**: Review Key Strengths and Areas for Improvement.
    - **Rubric Dimensions**: Review all 8 dimensions with individual scores, confidence ratings, verbatim quotes of submission evidence, architectural concerns, and actionable suggestions.
11. **Open Attempt History**:
    Click **"View History"** in the top header. Confirm Attempt #1 is displayed with its timestamp, status (`EVALUATED`), and score.
12. **Iterate via "Try Again"**:
    Click **"Try Again"**. Confirm that **Attempt #2** is created in `DRAFT` status with a `"Forked from previous attempt"` tag, allowing iterative improvement.

---

## Part 3: 2–3 Minute Presentation Flow

When presenting this project to interviewers or reviewers, follow this concise structure:

1. **Problem (30s)**:
   > *"Traditional platforms evaluate code algorithms with binary tests. LLD interviews evaluate architectural quality—coupling, cohesion, extensibility, and trade-offs. This platform provides structured practice and automated 8-dimension rubric feedback."*

2. **Architecture (30s)**:
   > *"We built a Clean Modular Monolith adhering to DDD principles. The domain layer has zero dependencies on databases or web frameworks. Attempt lifecycles are governed by an explicit GoF State Machine, and evaluation engines are isolated behind the `IEvaluator` strategy pattern."*

3. **Practice & Submission (30s)**:
   > *"The practice studio enforces cognitive discipline through 6 deliberate architectural sections, real-time debounced autosave, and a pre-submission completeness validation modal."*

4. **Evaluation & Feedback (30s)**:
   > *"Submissions are evaluated against 8 canonical rubric dimensions. The application layer deterministically calculates scores and passing thresholds to prevent hallucinations. Feedback includes quoted evidence, architectural concerns, and actionable advice."*

5. **Iteration & Try Again (30s)**:
   > *"Learners can fork attempts to iterate on their design and track their architectural improvement across attempts."*

6. **Key Engineering Highlights (15s)**:
   > *"91 automated tests passing, clean TypeScript compilation, dual-mode evaluation (zero-config Mock vs. real Gemini 1.5 Flash), and zero-friction sessionless learner isolation."*
