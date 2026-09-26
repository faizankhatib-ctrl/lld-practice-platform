import React from 'react';
import { CheckCircle2, XCircle, Award, Check, AlertTriangle } from 'lucide-react';

interface ScoreCardProps {
  overallScore: number;
  passed: boolean;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  overallScore,
  passed,
  summary,
  strengths = [],
  weaknesses = [],
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
      {/* Top Banner: Overall Score & Passed Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <Award className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>Overall Architectural Evaluation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {passed ? 'Solution Passed' : 'Needs Architectural Iteration'}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Big Score Gauge */}
          <div className="text-right">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white flex items-baseline justify-end gap-1">
              <span className={passed ? 'text-emerald-400' : 'text-amber-400'}>{overallScore}</span>
              <span className="text-lg text-slate-500 font-normal">/100</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Passing Threshold: 70/100</div>
          </div>

          {/* Status Indicator */}
          <div
            className={`p-3 rounded-2xl flex items-center justify-center ${
              passed
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {passed ? (
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            ) : (
              <XCircle className="w-8 h-8" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-6">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            passed ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, overallScore))}%` }}
        />
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="mb-6 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Executive Summary
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="rounded-xl bg-emerald-950/20 border border-emerald-900/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Key Architectural Strengths</span>
            </h4>
            <ul className="space-y-1.5">
              {strengths.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="rounded-xl bg-amber-950/20 border border-amber-900/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Areas for Improvement</span>
            </h4>
            <ul className="space-y-1.5">
              {weaknesses.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
