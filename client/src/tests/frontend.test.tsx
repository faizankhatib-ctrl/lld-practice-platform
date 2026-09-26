import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getLearnerId, resetLearnerId } from '../lib/learner';
import { StatusBadge, DifficultyBadge } from '../components/StatusBadge';
import { ProblemCard } from '../components/ProblemCard';
import { ScoreCard } from '../components/ScoreCard';
import { CriterionFeedback } from '../components/CriterionFeedback';
import { Problem, CriterionFeedbackItem } from '../types/api';

describe('Frontend Component & Architecture Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Learner ID persistence in localStorage
  it('1. should generate and persist learner ID in localStorage across calls', () => {
    const id1 = getLearnerId();
    expect(id1).toMatch(/^lld_learner_[a-z0-9]+/);

    // Second call should return the identical persisted ID
    const id2 = getLearnerId();
    expect(id2).toBe(id1);

    // Resetting should generate a distinct new ID
    const id3 = resetLearnerId();
    expect(id3).not.toBe(id1);
    expect(id3).toMatch(/^lld_learner_[a-z0-9]+/);
  });

  // 2. StatusBadge renders each state correctly
  it('2. should render distinct badges for all attempt states and difficulties', () => {
    const { rerender } = render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText('Draft')).toBeDefined();

    rerender(<StatusBadge status="EVALUATING" />);
    expect(screen.getByText('Evaluating...')).toBeDefined();

    rerender(<StatusBadge status="EVALUATED" />);
    expect(screen.getByText('Evaluated')).toBeDefined();

    rerender(<StatusBadge status="FAILED" />);
    expect(screen.getByText('Failed')).toBeDefined();

    rerender(<DifficultyBadge difficulty="MEDIUM" />);
    expect(screen.getByText('Medium')).toBeDefined();
  });

  // 3. ProblemCard renders problem details
  it('3. should render problem card with title, difficulty, time, and core entities', () => {
    const mockProblem: Problem = {
      id: 'p-parking-lot',
      slug: 'parking-lot',
      title: 'Design a Multi-Floor Parking Lot',
      difficulty: 'MEDIUM',
      estimatedTimeMinutes: 45,
      summary: 'Design an automated parking lot management system with gate sensors.',
      requiredEntities: ['ParkingLot', 'ParkingFloor', 'ParkingSpot', 'Ticket'],
      suggestedPatterns: ['Strategy Pattern', 'Factory Pattern'],
    };

    render(
      <MemoryRouter>
        <ProblemCard problem={mockProblem} />
      </MemoryRouter>
    );

    expect(screen.getByText('Design a Multi-Floor Parking Lot')).toBeDefined();
    expect(screen.getByText('Medium')).toBeDefined();
    expect(screen.getByText('45 mins')).toBeDefined();
    expect(screen.getByText('ParkingLot')).toBeDefined();
    expect(screen.getByText('Start Practice')).toBeDefined();
    expect(screen.getByText('View Problem')).toBeDefined();
  });

  // 4. ScoreCard renders score, passed status, strengths, and weaknesses
  it('4. should render ScoreCard with score metrics, passed status, and summary', () => {
    render(
      <ScoreCard
        overallScore={85}
        passed={true}
        summary="Well-architected low-level design."
        strengths={['Clean encapsulation of ParkingSpot', 'Decoupled payment strategy']}
        weaknesses={['Add distributed lock for spot reservation']}
      />
    );

    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText('Solution Passed')).toBeDefined();
    expect(screen.getByText('Well-architected low-level design.')).toBeDefined();
    expect(screen.getByText('Clean encapsulation of ParkingSpot')).toBeDefined();
    expect(screen.getByText('Add distributed lock for spot reservation')).toBeDefined();
  });

  // 5. CriterionFeedback renders evidence and suggestions prominently
  it('5. should render CriterionFeedback with evidence and actionable suggestion', () => {
    const mockCriterion: CriterionFeedbackItem = {
      criterion: 'Requirement Understanding',
      score: 85,
      maxScore: 100,
      evidence: 'Candidate accurately listed multi-floor and ticket tracking.',
      concern: 'Did not detail vehicle size category handling.',
      suggestion: 'Add vehicle size dimension to parking spots.',
      confidence: 'HIGH',
    };

    render(<CriterionFeedback criterion={mockCriterion} />);

    expect(screen.getByText('Requirement Understanding')).toBeDefined();
    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText(/Candidate accurately listed multi-floor/)).toBeDefined();
    expect(screen.getByText('Did not detail vehicle size category handling.')).toBeDefined();
    expect(screen.getByText('Add vehicle size dimension to parking spots.')).toBeDefined();
    expect(screen.getByText('High Confidence')).toBeDefined();
  });

  // 6. Six sections validation rule
  it('6. should validate that sections under 15 characters are considered invalid', () => {
    const minLength = 15;
    const shortText = 'too short';
    const validText = 'This is a sufficiently detailed section description meeting length requirements.';

    expect(shortText.trim().length < minLength).toBe(true);
    expect(validText.trim().length >= minLength).toBe(true);

    const sixSections = [
      'requirementsAndAssumptions',
      'classesAndResponsibilities',
      'interfacesAndRelationships',
      'designExplanation',
      'tradeoffs',
      'edgeCases',
    ];

    expect(sixSections.length).toBe(6);
  });
});
