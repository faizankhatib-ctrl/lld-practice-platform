import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemDetailsPage } from './pages/ProblemDetailsPage';
import { PracticePage } from './pages/PracticePage';
import { FeedbackPage } from './pages/FeedbackPage';
import { HistoryPage } from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* 1. Redirect / to /problems */}
            <Route path="/" element={<Navigate to="/problems" replace />} />

            {/* 2. Problems Catalog */}
            <Route path="/problems" element={<ProblemsPage />} />

            {/* 3. Problem Details Spec */}
            <Route path="/problems/:slug" element={<ProblemDetailsPage />} />

            {/* 4. Practice Studio Editor */}
            <Route path="/problems/:slug/practice/:attemptId" element={<PracticePage />} />

            {/* 5. Evaluation Feedback & Rubric Review */}
            <Route path="/attempts/:attemptId/feedback" element={<FeedbackPage />} />

            {/* 6. Problem Attempt History */}
            <Route path="/problems/:slug/history" element={<HistoryPage />} />

            {/* Fallback to /problems */}
            <Route path="*" element={<Navigate to="/problems" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-500">
          LLD Practice Platform &copy; {new Date().getFullYear()} — Built for Deliberate Engineering Mastery
        </footer>
      </div>
    </Router>
  );
};

export default App;
