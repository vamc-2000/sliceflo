import axiosInstance from './axios-instance';
import type {
  Label,
  CreateLabelRequest,
  LabelsApiResponse,
} from '@/types/labels.types'; // Create this types file

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Labels API
export const labelsApi = {
  // Get all labels for workspace
  getLabels: async (workspaceId: string): Promise<Label[]> => {
    const response = await axiosInstance.get<LabelsApiResponse>(
      `${API_BASE_URL}/workspace/${workspaceId}/labels`
    );
    // Handle both direct array and object-wrapped labels
    return Array.isArray(response) ? response : (response.labels || []);
  },

  // Create new label
  createLabel: async (
    workspaceId: string,
    data: CreateLabelRequest
  ): Promise<Label> => {
    const response = await axiosInstance.post<Label>(
      `${API_BASE_URL}/workspace/${workspaceId}/labels`,
      data
    );
    return response;
  },

  // Get workspace label by ID
  getLabelById: async (
    workspaceId: string,
    labelId: string
  ): Promise<Label> => {
    const response = await axiosInstance.get<Label>(
      `${API_BASE_URL}/workspace/${workspaceId}/labels/${labelId}`
    );
    return response;
  },

  // Update label (using PATCH as requested)
  updateLabel: async (
    workspaceId: string,
    labelId: string,
    data: Partial<CreateLabelRequest>
  ): Promise<Label> => {
    const response = await axiosInstance.patch<Label>(
      `${API_BASE_URL}/workspace/${workspaceId}/labels/${labelId}`,
      data
    );
    return response;
  },

  // Delete label
  deleteLabel: async (workspaceId: string, labelId: string): Promise<void> => {
    await axiosInstance.delete(
      `${API_BASE_URL}/workspace/${workspaceId}/labels/${labelId}`
    );
  },
};
