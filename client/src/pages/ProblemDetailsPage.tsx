import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProblem } from '../api/problems';
import { createAttempt } from '../api/attempts';
import { Problem } from '../types/api';
import { DifficultyBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { getApiErrorMessage } from '../lib/api';
import {
  Clock,
  Box,
  Sparkles,
  ArrowLeft,
  Play,
  History,
  CheckCircle2,
  Shield,
  FileCheck2,
} from 'lucide-react';

export const ProblemDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProblem = async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchProblem(slug);
      setProblem(data);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProblem();
  }, [slug]);

  const handleStartPractice = async () => {
    if (!problem) return;
    try {
      setIsStarting(true);
      const result = await createAttempt(problem.id);
      navigate(`/problems/${problem.slug}/practice/${result.attemptId}`);
    } catch (err) {
      alert(`Could not start practice session: ${getApiErrorMessage(err)}`);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24">
        <LoadingState
          message="Loading problem specification..."
          subMessage="Fetching requirements, constraints, and rubric criteria"
        />
      </div>
    );
  }

  if (errorMessage || !problem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Problem not found"
          message={errorMessage || 'Unable to retrieve problem details.'}
          onRetry={loadProblem}
        />
        <div className="text-center mt-6">
          <Link
            to="/problems"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Problems</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/problems"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Problem Catalog</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={problem.difficulty} />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Recommended Time: {problem.estimatedTimeMinutes} mins</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to={`/problems/${problem.slug}/history`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>View History</span>
            </Link>

            <button
              onClick={handleStartPractice}
              disabled={isStarting}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>{isStarting ? 'Creating Attempt...' : 'Start Practice'}</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          {problem.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
          {problem.summary}
        </p>
      </div>

      {/* Requirements & Constraints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Functional Requirements */}
        {problem.functionalRequirements && problem.functionalRequirements.length > 0 && (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Functional Requirements</span>
            </h3>
            <ul className="space-y-2.5">
              {problem.functionalRequirements.map((req, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Non-Functional Requirements */}
        {problem.nonFunctionalRequirements && problem.nonFunctionalRequirements.length > 0 && (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Non-Functional Requirements</span>
            </h3>
            <ul className="space-y-2.5">
              {problem.nonFunctionalRequirements.map((nfr, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                  <span>{nfr}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Constraints, Required Entities, Suggested Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Constraints */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
            System Constraints
          </h3>
          <ul className="space-y-2">
            {(problem.constraints || []).map((constraint, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Required Entities */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
            <Box className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Expected Domain Entities</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {problem.requiredEntities.map((entity) => (
              <span
                key={entity}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>

        {/* Suggested Patterns */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Suggested Patterns</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {problem.suggestedPatterns.map((pattern) => (
              <span
                key={pattern}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-900/60"
              >
                {pattern}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            *Suggested for reference; only apply patterns that naturally justify your design.
          </p>
        </div>
      </div>

      {/* Evaluation Rubric Dimensions */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
          <FileCheck2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>Evaluation Rubric Criteria (8 Canonical Dimensions)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Your submission will be evaluated objectively against these 8 core Low-Level Design dimensions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(problem.rubricCriteria || [
            'Requirement Understanding',
            'Class Responsibilities',
            'Coupling / Cohesion',
            'Encapsulation / Interfaces',
            'Abstraction / Patterns',
            'Extensibility',
            'Edge Cases / Testability',
            'Explanation Quality',
          ]).map((crit, idx) => (
            <div
              key={idx}
              className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center gap-2"
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="truncate">{crit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Practice Bar */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleStartPractice}
          disabled={isStarting}
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-sm font-semibold shadow-xl shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>{isStarting ? 'Creating Attempt...' : 'Start Practice Session'}</span>
        </button>
      </div>
    </div>
  );
};
