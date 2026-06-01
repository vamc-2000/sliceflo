import {
  CreateWorkspaceRequest,
  Workspace,
  WorkspaceCustomFieldConfig,
  ProjectPhase,
} from "@/types/workspace.types";
import axiosInstance from "./axios-instance";

export type WorkspacePayload = Partial<Workspace>;

// Create workspace - accepts CreateWorkspaceRequest, returns full Workspace
export const createWorkspace = async (
  payload: CreateWorkspaceRequest
): Promise<Workspace> => {
  const data = await axiosInstance.post<Workspace>('/workspace', payload);
  return data;
};

//Get all workspaces
export const getWorkspaces = async (): Promise<Workspace[]> => {
  const response = await axiosInstance.get('/workspace');
  return response.workspaces || [];
};

// Get workspace members
export const getWorkspaceMembers = async (workspaceId: string) => {
  const data = await axiosInstance.get(`/workspace/${workspaceId}/members`);
  return data;
};

// Invite members to workspace
export const inviteWorkspaceMembers = async (
  workspaceId: string,
  emails: string[]
) => {
  const data = await axiosInstance.post(`/workspace/${workspaceId}/members`, {
    emails,
  });
  return data;
};

// Update workspace on backend
export const updateWorkspace = async (
  workspaceId: string,
  updatedData: Partial<Workspace>
): Promise<Workspace> => {
  const data = await axiosInstance.put(
    `/workspace/${workspaceId}`,
    updatedData
  );
  return data;
};

// Remove member from workspace
export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string[]
) => {
  const data = await axiosInstance.delete(
    `/workspace/${workspaceId}/members/`,
    {
      data: { userIds: userId },
    }
  );
  return data;
};

// GET workspace custom fields
export const getWorkspaceCustomFields = async (
  workspaceId: string
): Promise<WorkspaceCustomFieldConfig[]> => {
  const data = await axiosInstance.get<WorkspaceCustomFieldConfig[]>(
    `/workspace/${workspaceId}/custom-fields-config`
  );
  return data;
};

// POST - Create workspace custom field
export const createWorkspaceCustomField = async (
  workspaceId: string,
  fieldData: Omit<WorkspaceCustomFieldConfig, '_id'>
): Promise<WorkspaceCustomFieldConfig> => {
  const data = await axiosInstance.post<WorkspaceCustomFieldConfig>(
    `/workspace/${workspaceId}/custom-fields-config`,
    fieldData
  );
  return data;
};

// PUT - Update workspace custom field
export const updateWorkspaceCustomField = async (
  workspaceId: string,
  fieldId: string,
  fieldData: Partial<Omit<WorkspaceCustomFieldConfig, '_id' | 'name' | 'type'>>
): Promise<WorkspaceCustomFieldConfig> => {
  const data = await axiosInstance.put<WorkspaceCustomFieldConfig>(
    `/workspace/${workspaceId}/custom-fields-config/${fieldId}`,
    fieldData
  );
  return data;
};

// DELETE workspace custom field
export const deleteWorkspaceCustomField = async (
  workspaceId: string,
  fieldId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/workspace/${workspaceId}/custom-fields-config/${fieldId}`
  );
};

// GET all project phases for workspace
export const getProjectPhasesApi = async (workspaceId: string): Promise<ProjectPhase[]> => {
  const data = await axiosInstance.get(`/workspace/${workspaceId}/project-state-config`);
  return data; // returns array directly
};

// POST - add parent phase
export const createProjectPhaseApi = async (workspaceId: string, data: {
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
}): Promise<ProjectPhase> => {
  const response = await axiosInstance.post(`/workspace/${workspaceId}/project-state-config`, data);
  return response;
};

// POST - add child phase
export const createChildProjectPhaseApi = async (
  workspaceId: string,
  parentStateId: string,
  data: {
    value: string;
    label: string;
    description?: string;
    color: string;
    order: number;
  }
): Promise<ProjectPhase> => {
  const response = await axiosInstance.post(
    `/workspace/${workspaceId}/project-state-config?isChild=true&parentStateId=${parentStateId}`,
    data
  );
  return response;
};

// PUT - update parent phase
export const updateProjectPhaseApi = async (
  workspaceId: string,
  stateId: string,
  data: { value?: string; label?: string; description?: string; color?: string; order?: number }
): Promise<ProjectPhase> => {
  const response = await axiosInstance.put(
    `/workspace/${workspaceId}/project-state-config/${stateId}`,
    data
  );
  return response;
};

// PUT - update child phase
export const updateChildProjectPhaseApi = async (
  workspaceId: string,
  stateId: string,
  parentStateId: string,
  data: { value?: string; label?: string; description?: string; color?: string; order?: number }
): Promise<ProjectPhase> => {
  const response = await axiosInstance.put(
    `/workspace/${workspaceId}/project-state-config/${stateId}?isChild=true&parentStateId=${parentStateId}`,
    data
  );
  return response;
};

// DELETE - parent phase
export const deleteProjectPhaseApi = async (workspaceId: string, stateId: string): Promise<void> => {
  await axiosInstance.delete(`/workspace/${workspaceId}/project-state-config/${stateId}`);
};

// DELETE - child phase
export const deleteChildProjectPhaseApi = async (
  workspaceId: string,
  stateId: string,
  parentStateId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/workspace/${workspaceId}/project-state-config/${stateId}?isChild=true&parentStateId=${parentStateId}`
  );
};