import axios, { AxiosError } from 'axios';
import { getLearnerId } from './learner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Automatically attach learner ID to all requests
apiClient.interceptors.request.use((config) => {
  config.headers['x-learner-id'] = getLearnerId();
  return config;
});

/**
 * Extracts a clean, user-friendly error message from an API error response.
 * Prevents raw stack traces or internal server error structures from leaking to the UI.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ error?: { message?: string; details?: unknown } }>;
    if (axiosErr.response?.data?.error?.message) {
      return axiosErr.response.data.error.message;
    }
    if (axiosErr.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (axiosErr.response?.status === 409) {
      return 'Action conflicts with the current attempt state.';
    }
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (!axiosErr.response) {
      return 'Unable to reach backend server. Please verify the service is running.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
