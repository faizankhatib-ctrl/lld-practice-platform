import React, { useEffect, useState } from 'react';
import { fetchProblems } from '../api/problems';
import { Problem } from '../types/api';
import { ProblemCard } from '../components/ProblemCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { getApiErrorMessage } from '../lib/api';
import { Sparkles, Terminal, ArrowRight, Compass } from 'lucide-react';

export const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProblems = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchProblems();
      setProblems(data);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Practice Loop Guide */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/20 border border-slate-800 p-6 sm:p-10 mb-10 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Deliberate Practice Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Master Low-Level Design Through Iterative Feedback
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Practice real-world object-oriented architecture problems. Submit your structural models,
            receive comprehensive 8-dimension rubric feedback, and iterate on your design.
          </p>

          {/* Interactive Steps Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
              1. Choose Problem
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
              2. Design Solution
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
              3. Submit
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 border border-emerald-800/60">
              4. Get AI Feedback
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
              5. Try Again
            </span>
          </div>
        </div>
      </div>

      {/* Problems Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            Curated LLD Problems
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Carefully structured low-level design challenges with clear requirements and rubric criteria.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          {problems.length} Problems Available
        </div>
      </div>

      {/* Content States */}
      {isLoading ? (
        <LoadingState
          message="Loading curated LLD problems..."
          subMessage="Connecting to platform registry and seeding catalog"
          className="py-24"
        />
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load problems"
          message={errorMessage}
          onRetry={loadProblems}
          className="my-12"
        />
      ) : problems.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-slate-500" aria-hidden="true" />}
          title="No problems found"
          description="The problem catalog is currently empty. Run database seed to populate problems."
          actionLabel="Refresh Catalog"
          onAction={loadProblems}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}
    </div>
  );
};
