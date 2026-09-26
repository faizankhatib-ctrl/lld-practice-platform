import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Problem } from '../types/api';
import { DifficultyBadge } from './StatusBadge';
import { Clock, Box, Sparkles, ArrowRight, Play } from 'lucide-react';
import { createAttempt } from '../api/attempts';

interface ProblemCardProps {
  problem: Problem;
  onStartingPractice?: (isStarting: boolean) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onStartingPractice }) => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStartPractice = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsStarting(true);
      onStartingPractice?.(true);
      const result = await createAttempt(problem.id);
      navigate(`/problems/${problem.slug}/practice/${result.attemptId}`);
    } catch (err) {
      console.error('Failed to create attempt:', err);
      // Fallback navigate to details page
      navigate(`/problems/${problem.slug}`);
    } finally {
      setIsStarting(false);
      onStartingPractice?.(false);
    }
  };

  const entitiesToShow = problem.requiredEntities?.slice(0, 4) || [];
  const remainingEntitiesCount = (problem.requiredEntities?.length || 0) - entitiesToShow.length;

  const patternsToShow = problem.suggestedPatterns?.slice(0, 3) || [];

  return (
    <div className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between overflow-hidden h-full">
      {/* Top subtle accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-6">
        {/* Header: Difficulty + Estimated Time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <DifficultyBadge difficulty={problem.difficulty} size="sm" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>{problem.estimatedTimeMinutes} mins</span>
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/problems/${problem.slug}`}
          className="text-lg font-bold text-white hover:text-emerald-400 transition-colors line-clamp-1 mb-2 block"
        >
          {problem.title}
        </Link>

        {/* Summary */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {problem.summary}
        </p>

        {/* Domain entities preview */}
        {entitiesToShow.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-1.5">
              <Box className="w-3 h-3 text-slate-500" aria-hidden="true" />
              <span>Core Entities:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entitiesToShow.map((entity) => (
                <span
                  key={entity}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  {entity}
                </span>
              ))}
              {remainingEntitiesCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800/40 text-slate-500 border border-slate-800">
                  +{remainingEntitiesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Suggested Patterns */}
        {patternsToShow.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-500/80" aria-hidden="true" />
              <span>Suggested Patterns:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patternsToShow.map((pattern) => (
                <span
                  key={pattern}
                  className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400/90 border border-emerald-900/40"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="px-6 py-4 border-t border-slate-800/70 bg-slate-950/40 flex items-center justify-between gap-3">
        <Link
          to={`/problems/${problem.slug}`}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800/60"
        >
          <span>View Problem</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        </Link>

        <button
          onClick={handleStartPractice}
          disabled={isStarting}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold transition-all shadow-md shadow-emerald-600/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Play className="w-3 h-3 fill-current" aria-hidden="true" />
          <span>{isStarting ? 'Starting...' : 'Start Practice'}</span>
        </button>
      </div>
    </div>
  );
};
