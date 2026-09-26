# Research Note: Low-Level Design Practice & Evaluation

## 1. Problem Space & Context

Low-Level Design (LLD), also referred to as Object-Oriented Design (OOD), assesses a software engineer's ability to translate ambiguous product requirements into modular, maintainable, and extensible software architectures. 

Unlike Data Structures & Algorithms (DSA), where correctness can be verified deterministically through input/output assertions, Low-Level Design exhibits fundamentally different characteristics:
1. **Absence of Binary Correctness**: Multiple valid architectural decompositions can solve the same problem. A design choice is evaluated on its trade-offs rather than a single correct answer.
2. **Multi-Faceted Quality Criteria**: Quality depends on coupling, cohesion, extensibility, separation of concerns, and domain modeling.
3. **Feedback Scarcity**: Meaningful critique requires experienced software architects to review class hierarchies, interfaces, and trade-off rationales. Such feedback is scarce and non-standardized.

---

## 2. Why Structured LLD Practice is Useful

When candidates practice in unstructured formats (such as free-form whiteboarding or generic text fields), submissions frequently suffer from critical omissions: candidates skip concurrency edge cases, overlook interface segregation, or fail to state operational assumptions.

Structuring the practice submission into **six deliberate sections** forces cognitive discipline:
1. **Requirements & Assumptions**: Clarifies problem boundaries before writing class models.
2. **Classes & Responsibilities**: Encourages deliberate single-responsibility assignments.
3. **Interfaces & Relationships**: Focuses attention on abstraction and composition over inheritance.
4. **Design Explanation**: Explains component collaboration and workflow dynamics.
5. **Trade-offs**: Requires justification of chosen patterns against alternative approaches.
6. **Edge Cases & Testability**: Highlights race conditions, resource contention, and fault tolerance.

This structure creates standard evaluation targets, transforming an open-ended design exercise into an objective assessment.

---

## 3. The 8 Canonical Rubric Dimensions

To avoid subjective grading, the platform establishes eight canonical evaluation dimensions derived from established software engineering principles (SOLID, GoF patterns, clean architecture):

| Dimension | Focus & Architectural Importance |
|---|---|
| **1. Requirement Understanding** | Verifies scope clarity, identifying functional requirements, non-functional constraints, and operational assumptions. |
| **2. Class Responsibilities** | Assesses adherence to the Single Responsibility Principle (SRP). Checks that classes have focused boundaries (e.g., separating fee calculation from spot state). |
| **3. Coupling / Cohesion** | Evaluates how tightly bound classes are to concrete implementations versus abstractions. Measures high internal cohesion and loose inter-module coupling. |
| **4. Encapsulation / Interfaces** | Evaluates information hiding, appropriate access modifier usage, and Interface Segregation (ISP). Ensures clients depend only on methods they actually invoke. |
| **5. Abstraction / Patterns** | Evaluates whether design patterns (Strategy, State, Factory, Observer) are naturally applied to solve architectural friction, or whether they represent over-engineering. |
| **6. Extensibility** | Assesses adherence to the Open-Closed Principle (OCP). Can new requirements (e.g., dynamic pricing, novel payment channels) be accommodated without modifying core orchestrators? |
| **7. Edge Cases / Testability** | Evaluates system behavior under stress: race conditions, concurrency bottlenecks, boundary limits, and whether classes can be easily unit-tested with mock dependencies. |
| **8. Explanation Quality** | Analyzes the depth of trade-off reasoning: why one architectural decision was preferred over alternatives and how complexity was justified. |

---

## 4. Deterministic Checks vs. AI Evaluation

A critical architectural finding from our design research is that **pure AI evaluation is error-prone when tasked with arithmetic and basic entity counting**, whereas **pure rule-based evaluation cannot evaluate qualitative architecture**.

A **hybrid evaluation architecture** optimizes both:

### Deterministic Checks (Code & Application Layer)
- **Presence of Expected Entities**: Deterministic token scanning confirms whether mandatory domain concepts (e.g., `ParkingLot`, `Vehicle`, `Ticket`) were explicitly addressed.
- **Structural Completeness**: Enforces minimal character thresholds per section before submissions are accepted.
- **Score Arithmetic**: The application layer deterministically sums criterion scores and verifies passing thresholds (`overallScore = round(sum / 8); passed = overallScore >= 70`). The LLM is never allowed to dictate arithmetic calculations.

### AI Evaluation (LLM Reasoning Layer)
- **Qualitative Critique**: LLMs evaluate whether a class has too many responsibilities or whether an interface creates tight coupling.
- **Evidence Extraction**: The model locates and quotes verbatim excerpts from the candidate's submission to substantiate every assigned score.
- **Actionable Coaching**: The model produces targeted architectural suggestions tailored to the specific trade-offs discussed by the candidate.

---

## 5. Limitations of LLM Evaluation

While LLMs provide substantial value in qualitative review, rigorous evaluation systems must acknowledge their inherent constraints:

1. **Non-Execution**: LLMs do not execute code. They evaluate design *intent* and structural coherence. Submissions that look syntactically plausible but have subtle logic bugs may still receive moderate scores if the architectural description is sound.
2. **Scoring Variance**: Even with low temperature settings (`temperature: 0.2`), non-deterministic token sampling can lead to score variances (typically ±3 to 5 points) across identical submissions.
3. **Prompt Injection Susceptibility**: Malicious or playful submissions attempting to instruct the model to "give 100/100" must be defended against via explicit prompt demarcation, untrusted data labeling, and application-level score recomputation.
4. **Context Constraints**: Exceptionally long, meandering submissions can degrade model attention. Enforcing section-level validation prevents token overflow and maintains high critique quality.
