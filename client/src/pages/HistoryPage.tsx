import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProblem, fetchProblemAttempts } from '../api/problems';
import { createAttempt } from '../api/attempts';
import { Problem, AttemptHistoryItem } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { getApiErrorMessage } from '../lib/api';
import {
  ArrowLeft,
  History,
  RotateCcw,
  Play,
  Calendar,
  ChevronRight,
  GitFork,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStartingNew, setIsStartingNew] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [problemData, historyData] = await Promise.all([
        fetchProblem(slug),
        fetchProblemAttempts(slug),
      ]);

      setProblem(problemData);
      setAttempts(historyData);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [slug]);

  const handleStartFreshAttempt = async () => {
    if (!problem) return;
    try {
      setIsStartingNew(true);
      const result = await createAttempt(problem.id);
      navigate(`/problems/${problem.slug}/practice/${result.attemptId}`);
    } catch (err) {
      alert(`Could not start attempt: ${getApiErrorMessage(err)}`);
    } finally {
      setIsStartingNew(false);
    }
  };

  const handleForkAttempt = async (parentAttemptId: string) => {
    if (!problem) return;
    try {
      setIsStartingNew(true);
      const result = await createAttempt(problem.id, parentAttemptId);
      navigate(`/problems/${problem.slug}/practice/${result.attemptId}`);
    } catch (err) {
      alert(`Could not fork attempt: ${getApiErrorMessage(err)}`);
    } finally {
      setIsStartingNew(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24">
        <LoadingState
          message="Loading attempt history..."
          subMessage="Fetching historical submissions and scores for this problem"
        />
      </div>
    );
  }

  if (errorMessage || !problem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Could not load history"
          message={errorMessage || 'Problem not found.'}
          onRetry={loadHistory}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          to={`/problems/${problem.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to {problem.title}</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Attempt History & Iterations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {problem.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your architectural iterations, compare scores, and review previous evaluations.
          </p>
        </div>

        <button
          onClick={handleStartFreshAttempt}
          disabled={isStartingNew}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all shrink-0 self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>New Attempt</span>
        </button>
      </div>

      {/* Attempts List */}
      {attempts.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-500" />}
          title="No previous attempts yet"
          description="You haven't started an attempt for this problem yet. Begin your first practice session to design your solution and receive rubric feedback."
          actionLabel="Start Attempt #1"
          onAction={handleStartFreshAttempt}
          className="py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80"
        />
      ) : (
        <div className="space-y-4">
          {attempts.map((att) => {
            const hasScore = att.overallScore !== null && att.overallScore !== undefined;
            const isPassing = hasScore && (att.overallScore as number) >= 70;
            const formattedDate = new Date(att.submittedAt || att.createdAt).toLocaleDateString(
              undefined,
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            );

            return (
              <div
                key={att.attemptId}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 hover:border-slate-700/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Column: Attempt metadata */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold font-mono text-white">
                      Attempt #{att.attemptNumber}
                    </span>
                    <StatusBadge status={att.status} size="sm" />
                    {att.parentAttemptId && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <GitFork className="w-3 h-3" aria-hidden="true" />
                        <span>Forked</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>{formattedDate}</span>
                  </div>

                  {att.evaluationSummary && (
                    <p className="text-xs text-slate-300 line-clamp-1 italic max-w-xl">
                      "{att.evaluationSummary}"
                    </p>
                  )}
                </div>

                {/* Right Column: Score & Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 self-end md:self-auto">
                  {/* Score badge if evaluated */}
                  {hasScore && (
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-xl font-bold font-mono ${
                            isPassing ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {att.overallScore}
                        </span>
                        <span className="text-xs text-slate-500">/100</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          isPassing ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isPassing ? 'Passed' : 'Needs Work'}
                      </span>
                    </div>
                  )}

                  {/* Actions depending on state */}
                  <div className="flex items-center gap-2">
                    {att.status === 'DRAFT' && (
                      <Link
                        to={`/problems/${problem.slug}/practice/${att.attemptId}`}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        <span>Continue Draft</span>
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    )}

                    {(att.status === 'EVALUATED' ||
                      att.status === 'EVALUATING' ||
                      att.status === 'SUBMITTED' ||
                      att.status === 'FAILED') && (
                      <Link
                        to={`/attempts/${att.attemptId}/feedback`}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        <span>View Feedback</span>
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    )}

                    {att.status === 'EVALUATED' && (
                      <button
                        onClick={() => handleForkAttempt(att.attemptId)}
                        disabled={isStartingNew}
                        type="button"
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-colors"
                        title="Fork this attempt into a new practice session"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        <span>Try Again</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
