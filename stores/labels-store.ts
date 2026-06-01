import { create } from 'zustand';
import { labelsApi } from '@/lib/api/labels-api';
import type { Label, CreateLabelRequest } from '@/types/labels.types';

interface LabelsState {
  labels: Label[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLabels: (workspaceId: string) => Promise<void>;
  createLabel: (workspaceId: string, data: CreateLabelRequest) => Promise<void>;
  updateLabel: (
    workspaceId: string,
    labelId: string,
    data: Partial<CreateLabelRequest>
  ) => Promise<void>;
  deleteLabel: (workspaceId: string, labelId: string) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>((set, get) => ({
  labels: [],
  isLoading: false,
  error: null,

  // 🔹 Fetch labels
  fetchLabels: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await labelsApi.getLabels(workspaceId);

      // res is already Label[]
      set({
        labels: res ?? [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Failed to fetch labels',
        isLoading: false,
      });
    }
  },

  // 🔹 Create label
  createLabel: async (workspaceId, data) => {
    try {
      const res = await labelsApi.createLabel(workspaceId, data);
      const newLabel = res;

      set({
        labels: [newLabel, ...get().labels],
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Failed to create label',
      });
      throw err;
    }
  },

  // 🔹 Update label
  updateLabel: async (workspaceId, labelId, data) => {
    try {
      const res = await labelsApi.updateLabel(workspaceId, labelId, data);
      const updated = res;

      set({
        labels: get().labels.map((l) =>
          l.id === labelId ? updated : l
        ),
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Failed to update label',
      });
      throw err;
    }
  },

  // 🔹 Delete label
  deleteLabel: async (workspaceId, labelId) => {
    try {
      await labelsApi.deleteLabel(workspaceId, labelId);

      set({
        labels: get().labels.filter((l) => l.id !== labelId),
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Failed to delete label',
      });
      throw err;
    }
  },
}));