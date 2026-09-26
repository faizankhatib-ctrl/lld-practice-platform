import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAttempt, fetchEvaluation, fetchAttemptStatus, retryEvaluation, createAttempt } from '../api/attempts';
import { fetchProblem } from '../api/problems';
import { Attempt, Problem, EvaluationData, AttemptStatus } from '../types/api';
import { ScoreCard } from '../components/ScoreCard';
import { CriterionFeedback } from '../components/CriterionFeedback';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { getApiErrorMessage } from '../lib/api';
import {
  ArrowLeft,
  RotateCcw,
  History,
  AlertTriangle,
  Loader2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [status, setStatus] = useState<AttemptStatus>('EVALUATING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isForking, setIsForking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef<number>(0);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const loadAttemptAndEval = async () => {
      if (!attemptId) return;
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const attemptData = await fetchAttempt(attemptId);
        if (!isMounted) return;
        setAttempt(attemptData);
        setStatus(attemptData.status);

        // Fetch associated problem
        try {
          const problemData = await fetchProblem(attemptData.problemId);
          if (isMounted) setProblem(problemData);
        } catch (e) {
          console.warn('Could not load problem:', e);
        }

        if (attemptData.status === 'EVALUATED') {
          const evalData = await fetchEvaluation(attemptId);
          if (isMounted) setEvaluation(evalData);
        }
      } catch (err) {
        if (isMounted) setErrorMessage(getApiErrorMessage(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAttemptAndEval();
    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [attemptId]);

  // Polling hook when status is SUBMITTED or EVALUATING
  useEffect(() => {
    if (!attemptId) return;

    if (status === 'SUBMITTED' || status === 'EVALUATING') {
      pollCountRef.current = 0;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        try {
          const statusData = await fetchAttemptStatus(attemptId);
          setStatus(statusData.status);

          if (statusData.status === 'EVALUATED') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            const evalData = await fetchEvaluation(attemptId);
            setEvaluation(evalData);
          } else if (statusData.status === 'FAILED') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setErrorMessage(statusData.errorMessage || 'Evaluation failed. You can retry evaluation.');
          }

          // Timeout after 30 polls (60 seconds)
          if (pollCountRef.current > 30) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setErrorMessage('Evaluation is taking longer than expected. Please check back or retry.');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, attemptId]);

  // Handle Retry
  const handleRetry = async () => {
    if (!attemptId) return;
    try {
      setIsRetrying(true);
      setErrorMessage(null);
      await retryEvaluation(attemptId);
      setStatus('EVALUATING');
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle Try Again (Fork attempt)
  const handleTryAgain = async () => {
    if (!attempt || !problem) return;
    try {
      setIsForking(true);
      const newAttempt = await createAttempt(problem.id, attempt.id);
      navigate(`/problems/${problem.slug}/practice/${newAttempt.attemptId}`);
    } catch (err) {
      alert(`Could not start new iteration: ${getApiErrorMessage(err)}`);
    } finally {
      setIsForking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24">
        <LoadingState
          message="Loading evaluation results..."
          subMessage="Fetching 8-dimension rubric feedback and score breakdown"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {problem && (
            <Link
              to={`/problems/${problem.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Problem</span>
            </Link>
          )}
          {attempt && (
            <span className="text-xs font-mono text-slate-400">
              Attempt #{attempt.attemptNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {problem && (
            <Link
              to={`/problems/${problem.slug}/history`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>View History</span>
            </Link>
          )}
        </div>
      </div>

      {/* STATE 1: EVALUATING / SUBMITTED */}
      {(status === 'SUBMITTED' || status === 'EVALUATING') && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-2xl">
          <div className="relative mb-6 mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" aria-hidden="true" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Evaluating Your Architecture...
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Your solution has been submitted. The evaluation engine is analyzing class responsibilities,
            interfaces, coupling, cohesion, and edge cases against the 8-dimension rubric.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" aria-hidden="true" />
            <span>Polling evaluation state (typically takes 5–15 seconds)...</span>
          </div>
        </div>
      )}

      {/* STATE 2: FAILED */}
      {status === 'FAILED' && (
        <div className="rounded-3xl bg-rose-950/20 border border-rose-900/40 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-400" aria-hidden="true" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-rose-200 mb-2">
            Evaluation Could Not Be Completed
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            {errorMessage || attempt?.errorMessage || 'An error occurred during evaluation.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Evaluation</span>
                </>
              )}
            </button>

            {problem && attempt && (
              <Link
                to={`/problems/${problem.slug}/practice/${attempt.id}`}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Review Solution
              </Link>
            )}
          </div>
        </div>
      )}

      {/* STATE 3: EVALUATED */}
      {status === 'EVALUATED' && evaluation && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top ScoreCard Banner */}
          <ScoreCard
            overallScore={evaluation.overallScore ?? 0}
            passed={evaluation.passed ?? false}
            summary={evaluation.summary}
            strengths={evaluation.strengths}
            weaknesses={evaluation.weaknesses}
          />

          {/* Action Row: Try Again / Iterate & Catalog Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">
                Ready for the Next Iteration?
              </h3>
              <p className="text-xs text-slate-400">
                Create Attempt #{attempt ? attempt.attemptNumber + 1 : 2} to refine your classes, address the architectural concerns, and elevate your score.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/problems"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>All Problems</span>
              </Link>

              <button
                onClick={handleTryAgain}
                disabled={isForking}
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {isForking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Forking Attempt...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Try Again (Iterate)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 8 Canonical Rubric Dimensions */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Rubric Evaluation Breakdown (8 Dimensions)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Concrete evidence, architectural trade-offs, and actionable suggestions derived from your submitted solution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(evaluation.criteriaScores || []).map((crit, idx) => (
                <CriterionFeedback key={idx} criterion={crit} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
