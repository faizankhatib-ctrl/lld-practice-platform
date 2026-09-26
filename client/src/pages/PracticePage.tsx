import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProblem } from '../api/problems';
import { fetchAttempt, saveDraft, submitAttempt } from '../api/attempts';
import { Problem, Attempt, StructuredTextSections } from '../types/api';
import { StatusBadge, DifficultyBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { getApiErrorMessage } from '../lib/api';
import {
  ArrowLeft,
  History,
  Send,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const MIN_SECTION_LENGTH = 15;

const SECTION_CONFIGS: Array<{
  key: keyof StructuredTextSections;
  number: number;
  label: string;
  helperText: string;
  placeholder: string;
}> = [
  {
    key: 'requirementsAndAssumptions',
    number: 1,
    label: 'Requirements & Assumptions',
    helperText: 'Clarify problem scope, in-scope vs out-of-scope capabilities, and domain assumptions.',
    placeholder: 'e.g. In-scope: Multi-floor parking, automated gate ticket issuance, hourly fee billing. Out-of-scope: Valet service.',
  },
  {
    key: 'classesAndResponsibilities',
    number: 2,
    label: 'Classes & Responsibilities',
    helperText: 'List core classes/entities and describe their single responsibility (SRP).',
    placeholder: 'e.g. ParkingLot (orchestrates floors & gates), ParkingFloor (manages spots), ParkingSpot (tracks occupancy), Ticket (records entry time).',
  },
  {
    key: 'interfacesAndRelationships',
    number: 3,
    label: 'Interfaces & Relationships',
    helperText: 'Define key interfaces, composition, inheritance, and association between classes.',
    placeholder: 'e.g. interface IParkingFeeStrategy { calculateFee(ticket: Ticket): number; }\nParkingLot has-a List<ParkingFloor>; ParkingFloor has-a List<ParkingSpot>.',
  },
  {
    key: 'designExplanation',
    number: 4,
    label: 'Design Explanation',
    helperText: 'Explain the core workflow, design patterns applied, and how components interact.',
    placeholder: 'e.g. Vehicle entry flow: Gate sensors trigger Ticket issuance -> Floor assigns spot using Strategy pattern -> Ticket marked active.',
  },
  {
    key: 'tradeoffs',
    number: 5,
    label: 'Trade-offs',
    helperText: 'Discuss design decisions, alternative approaches, and why you chose this design.',
    placeholder: 'e.g. We chose floor-level mutex locks instead of a single global lock to increase throughput during peak entry periods.',
  },
  {
    key: 'edgeCases',
    number: 6,
    label: 'Edge Cases & Testability',
    helperText: 'Identify concurrency issues, failure modes, boundary limits, and how to test them.',
    placeholder: 'e.g. Edge case: Two vehicles entering simultaneous gates attempting to claim the final spot. Handled via atomic reservation.',
  },
];

export const PracticePage: React.FC = () => {
  const { slug, attemptId } = useParams<{ slug: string; attemptId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [sections, setSections] = useState<StructuredTextSections>({
    requirementsAndAssumptions: '',
    classesAndResponsibilities: '',
    interfacesAndRelationships: '',
    designExplanation: '',
    tradeoffs: '',
    edgeCases: '',
  });

  // Autosave Status: 'SAVED' | 'SAVING' | 'ERROR' | 'UNSAVED'
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'ERROR' | 'UNSAVED'>('SAVED');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Spec Panel toggle
  const [showSpecDrawer, setShowSpecDrawer] = useState<boolean>(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSectionsRef = useRef<StructuredTextSections>(sections);
  latestSectionsRef.current = sections;

  // Load Problem & Attempt
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!slug || !attemptId) return;
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [problemData, attemptData] = await Promise.all([
          fetchProblem(slug),
          fetchAttempt(attemptId),
        ]);

        if (!isMounted) return;
        setProblem(problemData);
        setAttempt(attemptData);

        // Prepopulate sections if available
        if (attemptData.submission?.sections) {
          setSections({
            requirementsAndAssumptions: attemptData.submission.sections.requirementsAndAssumptions || '',
            classesAndResponsibilities: attemptData.submission.sections.classesAndResponsibilities || '',
            interfacesAndRelationships: attemptData.submission.sections.interfacesAndRelationships || '',
            designExplanation: attemptData.submission.sections.designExplanation || '',
            tradeoffs: attemptData.submission.sections.tradeoffs || '',
            edgeCases: attemptData.submission.sections.edgeCases || '',
          });
        }
      } catch (err) {
        if (isMounted) setErrorMessage(getApiErrorMessage(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [slug, attemptId]);

  // Debounced Autosave Handler
  const triggerAutosave = useCallback(
    (newSections: StructuredTextSections) => {
      if (!attempt || attempt.status !== 'DRAFT') return;

      setSaveStatus('UNSAVED');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          setSaveStatus('SAVING');
          await saveDraft(attempt.id, newSections);
          setSaveStatus('SAVED');
        } catch (err) {
          console.error('Autosave failure:', err);
          setSaveStatus('ERROR');
        }
      }, 800);
    },
    [attempt]
  );

  // Input Change Handler
  const handleSectionChange = (key: keyof StructuredTextSections, value: string) => {
    const updated = { ...sections, [key]: value };
    setSections(updated);
    triggerAutosave(updated);
  };

  // Validate all 6 sections before submitting
  const validateBeforeSubmit = (): string[] => {
    const errors: string[] = [];
    for (const config of SECTION_CONFIGS) {
      const text = (sections[config.key] || '').trim();
      if (!text || text.length < MIN_SECTION_LENGTH) {
        errors.push(
          `"${config.label}" must be at least ${MIN_SECTION_LENGTH} characters (currently ${text.length}).`
        );
      }
    }
    return errors;
  };

  const handleOpenSubmitModal = () => {
    const errors = validateBeforeSubmit();
    setValidationErrors(errors);
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!attempt || isSubmitting) return;

    // Validate once more
    const errors = validateBeforeSubmit();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      await submitAttempt(attempt.id, sections);
      // Immediately navigate to feedback page
      navigate(`/attempts/${attempt.id}/feedback`);
    } catch (err) {
      alert(`Submission failed: ${getApiErrorMessage(err)}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24">
        <LoadingState
          message="Preparing practice studio..."
          subMessage="Loading attempt state, draft content, and problem requirements"
        />
      </div>
    );
  }

  if (errorMessage || !problem || !attempt) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Could not load practice session"
          message={errorMessage || 'Attempt or problem not found.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const isEditable = attempt.status === 'DRAFT';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Practice Header Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <Link
                to={`/problems/${problem.slug}`}
                className="text-xs font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Problem Spec</span>
              </Link>
              <span className="text-slate-600">•</span>
              <DifficultyBadge difficulty={problem.difficulty} size="sm" />
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                Attempt #{attempt.attemptNumber}
              </span>
              {attempt.parentAttemptId && (
                <span className="text-[11px] font-mono text-emerald-400">
                  (Forked from previous attempt)
                </span>
              )}
              <StatusBadge status={attempt.status} size="sm" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {problem.title}
            </h1>
          </div>

          {/* Right Header Actions & Autosave Indicator */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Autosave Status Indicator */}
            {isEditable && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {saveStatus === 'SAVING' && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'SAVED' && (
                  <span className="text-emerald-400/90 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'ERROR' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Save Failed</span>
                  </span>
                )}
                {saveStatus === 'UNSAVED' && (
                  <span className="text-slate-500">Unsaved edits</span>
                )}
              </div>
            )}

            <Link
              to={`/problems/${problem.slug}/history`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History</span>
            </Link>

            {isEditable ? (
              <button
                onClick={handleOpenSubmitModal}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Evaluation</span>
              </button>
            ) : (
              <Link
                to={`/attempts/${attempt.id}/feedback`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-md shadow-sky-600/20"
              >
                <span>View Evaluation Feedback</span>
              </Link>
            )}
          </div>
        </div>

        {/* Non-editable Warning if not DRAFT */}
        {!isEditable && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              This attempt has been submitted and is read-only. To make changes, view feedback and click "Try Again" to fork a new attempt.
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Quick Spec Reference Drawer */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <button
          onClick={() => setShowSpecDrawer(!showSpecDrawer)}
          type="button"
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Quick Requirements & Entities Reference</span>
          </span>
          {showSpecDrawer ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showSpecDrawer && (
          <div className="p-4 pt-0 border-t border-slate-800 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5">
                Functional Requirements:
              </h5>
              <ul className="space-y-1 list-disc list-inside text-slate-300">
                {(problem.functionalRequirements || []).map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5">
                Expected Core Entities:
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {problem.requiredEntities.map((e) => (
                  <span
                    key={e}
                    className="font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Six Structured Sections */}
      <div className="space-y-6">
        {SECTION_CONFIGS.map((config) => {
          const currentLength = (sections[config.key] || '').trim().length;
          const meetsMin = currentLength >= MIN_SECTION_LENGTH;

          return (
            <div
              key={config.key}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 focus-within:border-emerald-500/50 transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <label
                    htmlFor={`section-${config.key}`}
                    className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs flex items-center justify-center font-mono border border-emerald-500/20"
                    >
                      {config.number}
                    </span>
                    <span>{config.label}</span>
                  </label>
                  <p id={`helper-${config.key}`} className="text-xs text-slate-400 mt-0.5">
                    {config.helperText}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-mono">
                  <span className={meetsMin ? 'text-slate-400' : 'text-amber-400'}>
                    {currentLength} chars
                  </span>
                  {meetsMin ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <span className="text-[10px] text-amber-400 font-sans">
                      (min {MIN_SECTION_LENGTH})
                    </span>
                  )}
                </div>
              </div>

              <textarea
                id={`section-${config.key}`}
                aria-describedby={`helper-${config.key}`}
                value={sections[config.key]}
                onChange={(e) => handleSectionChange(config.key, e.target.value)}
                disabled={!isEditable}
                placeholder={config.placeholder}
                rows={6}
                className="w-full mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 text-slate-100 placeholder-slate-600 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed resize-y min-h-[130px]"
              />
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar with Submit button */}
      {isEditable && (
        <div className="sticky bottom-4 mt-8 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All changes are automatically saved to your draft.</span>
          </div>

          <button
            onClick={handleOpenSubmitModal}
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Send className="w-4 h-4" />
            <span>Submit Solution</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Submit Solution for Evaluation?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Once submitted, this attempt will be locked and sent to the architectural evaluation pipeline.
              You will not be able to edit this attempt further (you can always iterate via "Try Again" after reviewing feedback).
            </p>

            {/* Validation Errors Alert (if any) */}
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Please complete all required sections:</span>
                </div>
                <ul className="space-y-1 list-disc list-inside text-rose-300/90">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting || validationErrors.length > 0}
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
