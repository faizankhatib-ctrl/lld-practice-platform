import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, User, BookOpen, Check, Copy } from 'lucide-react';
import { getLearnerId } from '../lib/learner';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [learnerId] = useState<string>(() => getLearnerId());
  const [copied, setCopied] = useState<boolean>(false);

  const isProblemsActive = location.pathname.startsWith('/problems') || location.pathname === '/';

  const handleCopyId = () => {
    navigator.clipboard?.writeText(learnerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/problems" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-slate-950 font-bold" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                LLD Practice Platform
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                Interactive Loop
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Deliberate Low-Level Design Practice
            </p>
          </div>
        </Link>

        {/* Navigation Links & Learner Identification */}
        <div className="flex items-center gap-3 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/problems"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isProblemsActive
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Problems</span>
            </Link>
          </nav>

          {/* Interactive Sessionless Learner Indicator */}
          <button
            onClick={handleCopyId}
            type="button"
            title="Click to copy your persistent Learner ID"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <User className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate max-w-[110px] sm:max-w-[150px]">
              {copied ? 'Copied ID!' : learnerId.replace('lld_learner_', 'user:')}
            </span>
            <Copy className="w-2.5 h-2.5 text-slate-600 hidden sm:inline-block" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
