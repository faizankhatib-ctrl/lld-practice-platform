import { apiClient } from '../lib/api';
import { Problem, ApiResponse, AttemptHistoryItem } from '../types/api';

export async function fetchProblems(): Promise<Problem[]> {
  const response = await apiClient.get<ApiResponse<Problem[]>>('/problems');
  return response.data.data;
}

export async function fetchProblem(idOrSlug: string): Promise<Problem> {
  const response = await apiClient.get<ApiResponse<Problem>>(`/problems/${idOrSlug}`);
  return response.data.data;
}

export async function fetchProblemAttempts(problemIdOrSlug: string): Promise<AttemptHistoryItem[]> {
  const response = await apiClient.get<ApiResponse<AttemptHistoryItem[]>>(`/problems/${problemIdOrSlug}/attempts`);
  return response.data.data;
}
