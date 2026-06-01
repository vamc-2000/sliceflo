// lib/api/drafts-api.ts
import axiosInstance from './axios-instance';

export interface DraftResponse {
  id: string;
  type: string;
  tenantId: string;
  userId: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  taskType: 'task' | 'subtask';
  parentTaskId?: string;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  iconId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatchDraftRequest {
  id?: string;
  draftId?: string;
  title?: string;
  description?: string;
  taskType?: 'task' | 'subtask';
  parentTaskId?: string;
  workspaceId?: string;
  projectId?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  iconId?: string;
  attachments?: string[];
}

export const getDraftsApi = async (params: { 
  workspaceId?: string; 
  type?: string; 
  taskType?: 'task' | 'subtask' 
}): Promise<DraftResponse[]> => {
  const data = await axiosInstance.get<{ success: boolean; data: { drafts: DraftResponse[] } }>('/drafts', { params });
  return data.data.drafts ?? [];
};

export const getDraftByIdApi = async (id: string, params?: { workspaceId?: string; type?: string; taskType?: string }): Promise<DraftResponse> => {
  const data = await axiosInstance.get<{ success: boolean; data: DraftResponse }>(`/drafts/${id}`, { params });
  return data.data;
};

export const patchDraftApi = async (payload: PatchDraftRequest): Promise<DraftResponse> => {
  const data = await axiosInstance.patch<{ success: boolean; data: DraftResponse }>('/drafts', payload);
  return data.data;
};

export const deleteDraftApi = async (id: string, params?: { workspaceId?: string; type?: string; taskType?: string }): Promise<void> => {
  await axiosInstance.delete(`/drafts/${id}`, { params });
};
