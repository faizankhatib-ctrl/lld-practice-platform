import React from 'react';
import { AttemptStatus, Difficulty } from '../types/api';
import { Clock, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: AttemptStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span>Draft</span>
        </span>
      );
    case 'SUBMITTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-950/60 text-sky-400 border border-sky-800/60 ${sizeClasses}`}
        >
          <Send className="w-3 h-3 text-sky-400" aria-hidden="true" />
          <span>Submitted</span>
        </span>
      );
    case 'EVALUATING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 animate-pulse ${sizeClasses}`}
        >
          <Loader2 className="w-3 h-3 text-amber-400 animate-spin" aria-hidden="true" />
          <span>Evaluating...</span>
        </span>
      );
    case 'EVALUATED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          <span>Evaluated</span>
        </span>
      );
    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60 ${sizeClasses}`}
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" aria-hidden="true" />
          <span>Failed</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-slate-800 text-slate-400 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  switch (difficulty) {
    case 'EASY':
      return (
        <span
          className={`font-semibold rounded-md uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}
        >
          Easy
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`font-semibold rounded-md uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}
        >
          Medium
        </span>
      );
    case 'HARD':
      return (
        <span
          className={`font-semibold rounded-md uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}
        >
          Hard
        </span>
      );
    default:
      return (
        <span className={`font-semibold rounded-md uppercase bg-slate-800 text-slate-400 ${sizeClasses}`}>
          {difficulty}
        </span>
      );
  }
};
