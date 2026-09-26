import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while fetching data.',
  onRetry,
  className = 'my-8',
}) => {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-900/40 bg-rose-950/20 p-6 text-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-rose-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-rose-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
