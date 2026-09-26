import React from 'react';
import { CriterionFeedbackItem, Confidence } from '../types/api';
import { Quote, AlertCircle, Lightbulb, ShieldCheck } from 'lucide-react';

interface CriterionFeedbackProps {
  criterion: CriterionFeedbackItem;
}

export const CriterionFeedback: React.FC<CriterionFeedbackProps> = ({ criterion }) => {
  // Score percentage calculation
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((criterion.score / (criterion.maxScore || 100)) * 100))
  );

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400 bg-emerald-500';
    if (pct >= 60) return 'text-amber-400 bg-amber-500';
    return 'text-rose-400 bg-rose-500';
  };

  const scoreColor = getScoreColor(percentage);

  const getConfidenceBadge = (confidence: Confidence) => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" /> High Confidence
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Med Confidence
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/60">
            Low Confidence
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700/80 transition-colors">
      {/* Header: Title, Confidence, Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white tracking-wide">
            {criterion.criterion}
          </h4>
          {getConfidenceBadge(criterion.confidence)}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold font-mono ${scoreColor.split(' ')[0]}`}>
            {criterion.score}
            <span className="text-xs text-slate-500 font-normal">/{criterion.maxScore || 100}</span>
          </span>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreColor.split(' ')[1]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Evidence from Candidate Submission (Prominent) */}
      {criterion.evidence && (
        <div className="mb-3 rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
            <Quote className="w-3 h-3 text-slate-500" aria-hidden="true" />
            <span>Observed Evidence from Submission:</span>
          </div>
          <p className="text-xs text-slate-300 font-mono italic pl-2 border-l-2 border-slate-700">
            "{criterion.evidence}"
          </p>
        </div>
      )}

      {/* Concern (if any) */}
      {criterion.concern && criterion.concern !== 'None noted.' && criterion.concern !== 'None' && (
        <div className="mb-3 rounded-lg bg-amber-950/20 border border-amber-900/30 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-1">
            <AlertCircle className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span>Architectural Concern:</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {criterion.concern}
          </p>
        </div>
      )}

      {/* Suggestion (Prominent Actionable Advice) */}
      {criterion.suggestion && (
        <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/30 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
            <Lightbulb className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            <span>Actionable Suggestion:</span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            {criterion.suggestion}
          </p>
        </div>
      )}
    </div>
  );
};
