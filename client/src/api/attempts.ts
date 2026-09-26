import { apiClient } from '../lib/api';
import {
  Attempt,
  AttemptStatusData,
  EvaluationData,
  StructuredTextSections,
  ApiResponse,
} from '../types/api';

export interface CreateAttemptResult {
  attemptId: string;
  attemptNumber: number;
  status: string;
  parentAttemptId: string | null;
}

export async function createAttempt(
  problemId: string,
  parentAttemptId?: string | null
): Promise<CreateAttemptResult> {
  const body = parentAttemptId ? { parentAttemptId } : {};
  const response = await apiClient.post<ApiResponse<CreateAttemptResult>>(
    `/problems/${problemId}/attempts`,
    body
  );
  return response.data.data;
}

export async function fetchAttempt(attemptId: string): Promise<Attempt> {
  const response = await apiClient.get<ApiResponse<Attempt>>(`/attempts/${attemptId}`);
  return response.data.data;
}

export async function saveDraft(
  attemptId: string,
  sections: Partial<StructuredTextSections>
): Promise<{ id: string; status: string; updatedAt: string }> {
  const response = await apiClient.put<
    ApiResponse<{ id: string; status: string; updatedAt: string }>
  >(`/attempts/${attemptId}/draft`, sections);
  return response.data.data;
}

export async function submitAttempt(
  attemptId: string,
  sections?: StructuredTextSections
): Promise<{ attemptId: string; status: string }> {
  const response = await apiClient.post<ApiResponse<{ attemptId: string; status: string }>>(
    `/attempts/${attemptId}/submit`,
    sections || {}
  );
  return response.data.data;
}

export async function fetchAttemptStatus(attemptId: string): Promise<AttemptStatusData> {
  const response = await apiClient.get<ApiResponse<AttemptStatusData>>(
    `/attempts/${attemptId}/status`
  );
  return response.data.data;
}

export async function fetchEvaluation(attemptId: string): Promise<EvaluationData> {
  const response = await apiClient.get<ApiResponse<EvaluationData>>(
    `/attempts/${attemptId}/evaluation`
  );
  return response.data.data;
}

export async function retryEvaluation(
  attemptId: string
): Promise<{ attemptId: string; status: string }> {
  const response = await apiClient.post<ApiResponse<{ attemptId: string; status: string }>>(
    `/attempts/${attemptId}/retry`
  );
  return response.data.data;
}
