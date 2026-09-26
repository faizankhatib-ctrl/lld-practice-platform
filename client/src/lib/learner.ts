const LEARNER_STORAGE_KEY = 'lld_learner_id';

/**
 * Retrieves the persistent learner ID from localStorage, or initializes
 * a unique anonymous ID if one does not yet exist.
 *
 * Format: lld_learner_<random_alphanumeric>
 */
export function getLearnerId(): string {
  try {
    const existing = localStorage.getItem(LEARNER_STORAGE_KEY);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const newId = `lld_learner_${randomSuffix}`;
    localStorage.setItem(LEARNER_STORAGE_KEY, newId);
    return newId;
  } catch (err) {
    // Fallback for non-browser or storage-restricted environments
    return 'lld_learner_session_user';
  }
}

/**
 * Resets the learner ID (useful for testing or switching persona)
 */
export function resetLearnerId(): string {
  try {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const newId = `lld_learner_${randomSuffix}`;
    localStorage.setItem(LEARNER_STORAGE_KEY, newId);
    return newId;
  } catch (err) {
    return 'lld_learner_session_user';
  }
}
