// stores/drafts-store.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import {
  DraftResponse,
  getDraftsApi,
  patchDraftApi,
  deleteDraftApi,
  getDraftByIdApi,
  PatchDraftRequest
} from '@/lib/api/drafts-api';
import { toast } from "@/components/ui/sonner";

const generateTempId = () => `temp-draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface DraftsState {
  drafts: DraftResponse[];
  isLoading: boolean;
  error: string | null;

  fetchDrafts: (workspaceId: string, taskType?: 'task' | 'subtask') => Promise<void>;
  saveDraft: (payload: PatchDraftRequest) => Promise<string>;
  deleteDraft: (id: string, workspaceId: string) => Promise<void>;
  getDraftById: (id: string, workspaceId: string) => Promise<DraftResponse | null>;
  getSubtasksByDraft: (draftId: string) => DraftResponse[];
  clearDrafts: () => void;
}

export const useDraftsStore = create<DraftsState>()(
  devtools(
    persist(
      (set, get) => ({
        drafts: [],
        isLoading: false,
        error: null,

        clearDrafts: () => set({ drafts: [] }, false, 'drafts/clearDrafts'),

        fetchDrafts: async (workspaceId: string, taskType?: 'task' | 'subtask') => {
          set({ isLoading: true, error: null }, false, 'fetchDrafts/start');
          try {
            const drafts = await getDraftsApi({ workspaceId, taskType });
            set({ drafts, isLoading: false }, false, 'fetchDrafts/success');
          } catch (error: any) {
            set({
              error: error.message || 'Failed to fetch drafts',
              isLoading: false,
            }, false, 'fetchDrafts/error');
            toast('error', { title: 'Failed to fetch drafts' });
          }
        },

        saveDraft: async (payload: PatchDraftRequest) => {
          const isUpdate = !!(payload.id || payload.draftId);
          const tempId = isUpdate ? (payload.id || payload.draftId)! : generateTempId();

          // Optimistic update for UI feel (if it's an update)
          if (isUpdate) {
            set(
              (state) => ({
                drafts: state.drafts.map((d) => (d.id === tempId ? { ...d, ...payload } : d)) as DraftResponse[],
              }),
              false,
              'saveDraft/optimistic-update'
            );
          }

          try {
            const result = await patchDraftApi(payload);

            set(
              (state) => {
                if (isUpdate) {
                  return {
                    drafts: state.drafts.map((d) => (d.id === tempId ? result : d)),
                  };
                } else {
                  return {
                    drafts: [...state.drafts, result],
                  };
                }
              },
              false,
              'saveDraft/success'
            );

            return result.id;
          } catch (error: any) {
            toast('error', { title: 'Failed to save draft' });
            // If it was an update, we should ideally rollback, but since we don't have a full snapshot here easily, 
            // we might just want to re-fetch or let the user know.
            if (isUpdate) {
              // Optional: re-fetch to ensure state is consistent
              // get().fetchDrafts(payload.workspaceId!);
            }
            throw error;
          }
        },

        deleteDraft: async (id: string, workspaceId: string) => {
          const snapshot = get().drafts.find(d => d.id === id);
          if (!snapshot) return;

          // Optimistic delete
          set(
            (state) => ({
              drafts: state.drafts.filter((d) => d.id !== id),
            }),
            false,
            'deleteDraft/optimistic'
          );

          try {
            await deleteDraftApi(id, { workspaceId });
            toast('success', { title: 'Draft deleted' });
          } catch (error: any) {
            // Rollback
            set(
              (state) => ({
                drafts: [...state.drafts, snapshot],
              }),
              false,
              'deleteDraft/rollback'
            );
            toast('error', { title: 'Failed to delete draft' });
          }
        },

        getDraftById: async (id: string, workspaceId: string) => {
          try {
            const draft = await getDraftByIdApi(id, { workspaceId });
            return draft;
          } catch (error) {
            console.error('Failed to fetch draft by id:', error);
            return null;
          }
        },

        getSubtasksByDraft: (draftId: string) => {
          return get().drafts.filter(d => d.parentTaskId === draftId);
        },
      }),
      {
        name: 'drafts-storage',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'DraftsStore' }
  )
);
