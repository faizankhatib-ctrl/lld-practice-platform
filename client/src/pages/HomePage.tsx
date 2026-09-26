import React, { useEffect, useState } from 'react';
import { checkServerHealth } from '../api/client';
import { CheckCircle2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyHealth = async () => {
    try {
      setHealthStatus('checking');
      setErrorMsg(null);
      const res = await checkServerHealth();
      setHealthStatus(res.status);
    } catch (err: any) {
      setHealthStatus('error');
      setErrorMsg(err.message || 'Failed to connect to backend server');
    }
  };

  useEffect(() => {
    verifyHealth();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Shell */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5" /> Phase 1 Foundation Verified
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          LLD Practice Platform
        </h1>
        <p className="text-lg text-slate-300">
          A focused platform to master Low-Level Design through deliberate practice, structured submissions, and actionable rubric feedback.
        </p>
      </div>

      {/* Backend Health Check Pill */}
      <div className="max-w-md mx-auto mb-12 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {healthStatus === 'checking' && (
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            )}
            {healthStatus === 'ok' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            {healthStatus === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-white">Backend Health Status</p>
              <p className="text-xs text-slate-400 font-mono">GET /api/v1/health</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                healthStatus === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : healthStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {healthStatus.toUpperCase()}
            </span>
            <button
              onClick={verifyHealth}
              title="Recheck"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {errorMsg && (
          <p className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
            {errorMsg}
          </p>
        )}
      </div>

      {/* The Practice Loop Flow Placeholder */}
      <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-6">
          The Core Learner Journey
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          {[
            { step: '1', title: 'Choose Problem', desc: 'Parking Lot, Elevator...' },
            { step: '2', title: 'Think / Design', desc: 'Classes & Patterns' },
            { step: '3', title: 'Submit', desc: 'Structured Solution' },
            { step: '4', title: 'Get Feedback', desc: '8-Criterion Rubric' },
            { step: '5', title: 'Review', desc: 'Analyze Suggestions' },
            { step: '6', title: 'Try Again', desc: 'Refine & Iterate' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center relative group hover:border-emerald-500/40 transition"
            >
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                {item.step}
              </span>
              <p className="text-xs font-bold text-slate-200">{item.title}</p>
              <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
