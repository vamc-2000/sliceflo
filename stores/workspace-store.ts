import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Workspace, CustomField, Label, WorkspaceMember, ProjectPhase, WorkspaceCustomFieldConfig } from '@/types/workspace.types';
import {
  createWorkspace,
  getWorkspaces,
  inviteWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspace,
  getWorkspaceMembers,
  getWorkspaceCustomFields,
  createWorkspaceCustomField,
  updateWorkspaceCustomField,
  deleteWorkspaceCustomField,
  getProjectPhasesApi,
  createProjectPhaseApi,
  createChildProjectPhaseApi,
  updateProjectPhaseApi,
  updateChildProjectPhaseApi,
  deleteProjectPhaseApi,
  deleteChildProjectPhaseApi,
} from '@/lib/api/workspace-api';
import { labelsApi } from '@/lib/api/labels-api';
import { CreateLabelRequest } from '@/types/labels.types';

interface WorkspaceStoreState {
  // State
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceMembers: WorkspaceMember[];
  workspaceCustomFieldsConfig: Record<string, WorkspaceCustomFieldConfig[]>;
  projectPhases: ProjectPhase[];
  isLoadingPhases: boolean;
  isLoading: boolean;
  isWorkspaceSwitching: boolean;
  error: string | null;

  // Workspace Actions
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;
  addWorkspace: (workspace: Workspace) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, updatedData: Partial<Workspace>) => Promise<void>;
  updateWorkspaceLocally: (workspaceId: string, localData: Partial<Workspace>) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;

  // Member Actions
  addMembersToWorkspace: (workspaceId: string, members: { userId: string; role: string }[]) => Promise<void>;
  removeMemberFromWorkspace: (workspaceId: string, userIds: string[]) => Promise<void>;
  refreshWorkspaceMembers: (workspaceId: string) => Promise<void>;

  // Workspace Custom Field Config Actions (NEW)
  fetchWorkspaceCustomFieldsConfig: (workspaceId: string) => Promise<void>;
  addWorkspaceCustomFieldConfig: (workspaceId: string, fieldData: Omit<WorkspaceCustomFieldConfig, '_id'>) => Promise<WorkspaceCustomFieldConfig>;
  updateWorkspaceCustomFieldConfig: (workspaceId: string, fieldId: string, updates: Partial<WorkspaceCustomFieldConfig>) => Promise<void>;
  deleteWorkspaceCustomFieldConfig: (workspaceId: string, fieldId: string) => Promise<void>;

  // Custom Field Actions
  addCustomField: (workspaceId: string, field: CustomField) => void;
  updateCustomField: (workspaceId: string, fieldId: string, updates: Partial<CustomField>) => void;
  deleteCustomField: (workspaceId: string, fieldId: string) => void;

  // Label Actions
  fetchLabels: (workspaceId: string) => Promise<void>;
  addLabel: (workspaceId: string, label: CreateLabelRequest) => Promise<Label>;
  updateLabel: (workspaceId: string, labelId: string, updates: Partial<CreateLabelRequest>) => Promise<void>;
  deleteLabel: (workspaceId: string, labelId: string) => Promise<void>;


  // Project Phase actions
  fetchProjectPhases: (workspaceId: string) => Promise<void>;
  addProjectPhase: (workspaceId: string, data: {
    label: string;
    color: string;
    description?: string;
  }) => Promise<void>;
  addChildPhase: (workspaceId: string, parentId: string, data: {
    label: string;
    color: string;
    description?: string;
  }) => Promise<void>;
  updateProjectPhase: (workspaceId: string, stateId: string, data: {
    label?: string;
    color?: string;
    description?: string;
  }) => Promise<void>;
  updateChildPhase: (workspaceId: string, stateId: string, parentId: string, data: {
    label?: string;
    color?: string;
    description?: string;
  }) => Promise<void>;
  deleteProjectPhase: (workspaceId: string, stateId: string) => Promise<void>;
  deleteChildPhase: (workspaceId: string, stateId: string, parentId: string) => Promise<void>;

  // Utility Actions
  setLoading: (isLoading: boolean) => void;
  setIsWorkspaceSwitching: (isSwitching: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearWorkspaces: () => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      workspaces: [],
      currentWorkspace: null,
      workspaceMembers: [],
      workspaceCustomFieldsConfig: {},
      projectPhases: [],
      isLoadingPhases: false,
      isLoading: false,
      isWorkspaceSwitching: false,
      error: null,

      // ========== WORKSPACE ACTIONS ==========
      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const workspaces = await getWorkspaces();
          const existingWorkspaces = get().workspaces;

          const mergedWorkspaces = workspaces.map((ws: Workspace) => {
            const existing = existingWorkspaces.find(ew => ew.id === ws.id);
            return {
              ...ws,
              icon: ws.icon || existing?.icon,
              slug: ws.slug || existing?.slug,
              customFields: ws.customFields || existing?.customFields || [],
              labels: ws.labels || existing?.labels || [],
              projectPhases: ws.projectPhases || existing?.projectPhases || [],
            };
          });

          const condition: any = mergedWorkspaces.length > 0
            ? mergedWorkspaces.find(w => w.id === get().currentWorkspace?.id) || mergedWorkspaces[0]
            : null
          set({
            workspaces: mergedWorkspaces,
            isLoading: false,
            error: null,
            currentWorkspace: mergedWorkspaces.length > 0
              ? mergedWorkspaces.find(w => w.id === get().currentWorkspace?.id) || mergedWorkspaces[0]
              : null,
          });
        } catch (error: any) {
          console.error("Fetch Workspaces Error:", error);
          set({
            error: error.response?.data?.message || "Failed to fetch workspaces",
            isLoading: false,
          });
        }
      },
      fetchWorkspaceMembers: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getWorkspaceMembers(workspaceId);
          // console.log("Workspace members: ", response);
          set({
            workspaceMembers: response.members || [],
            isLoading: false
          });
        } catch (error: any) {
          console.error("Fetch Workspace Members Error:", error);
          set({
            error: error.response?.data?.message || "Failed to fetch workspace members",
            isLoading: false,
            workspaceMembers: []
          });
        }
      },

      addWorkspace: async (workspace) => {
        set({ isLoading: true, error: null });
        try {
          const newWorkspace = await createWorkspace(workspace);
          set((state) => ({
            workspaces: [...state.workspaces, { ...newWorkspace, customFields: [] }],
            isLoading: false,
            error: null,
          }));
          return newWorkspace;
        } catch (error: any) {
          console.error("Create Workspace Error:", error);
          set({
            error: error.response?.data?.message || "Failed to create workspace",
            isLoading: false,
          });
          throw error;
        }
      },

      updateWorkspace: async (workspaceId, updatedData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedWorkspace = await updateWorkspace(workspaceId, updatedData);

          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId ? { ...ws, ...updatedWorkspace } : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? { ...state.currentWorkspace, ...updatedWorkspace }
                : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error("Update Workspace Error:", error);
          set({
            error: error.response?.data?.message || "Failed to update workspace",
            isLoading: false,
          });
        }
      },

      refreshWorkspaceMembers: async (workspaceId: string) => {
        await getWorkspaceMembers(workspaceId)
        // Double-fetch for API consistency
        setTimeout(() => getWorkspaceMembers(workspaceId), 200)
      },

      updateWorkspaceLocally: (workspaceId, localData) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? { ...ws, ...localData } : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? { ...state.currentWorkspace, ...localData }
              : state.currentWorkspace,
        }));
      },

      setCurrentWorkspace: (workspace) =>
        set({ currentWorkspace: workspace, error: null }),

      fetchLabels: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const labels = await labelsApi.getLabels(workspaceId);
          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId ? { ...ws, labels } : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? { ...state.currentWorkspace, labels }
                : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error("Fetch Labels Error:", error);
          set({
            error: error.response?.data?.message || "Failed to fetch labels",
            isLoading: false,
          });
        }
      },

      // ========== MEMBER ACTIONS ==========
      addMembersToWorkspace: async (workspaceId: string, members: { userId: string; role: string }[]) => {
        set({ isLoading: true, error: null });
        try {
          await inviteWorkspaceMembers(workspaceId, members.map(m => m.userId));

          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId ? { ...ws, members } : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? { ...state.currentWorkspace, members }
                : state.currentWorkspace,
            isLoading: false,
            error: null,
          }));
        } catch (error: any) {
          console.error("Add Members Error:", error);
          set({
            error: error.response?.data?.message || "Failed to add members",
            isLoading: false,
          });
        }
      },

      removeMemberFromWorkspace: async (workspaceId: string, userIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          await removeWorkspaceMember(workspaceId, userIds);
          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId
                ? {
                  ...ws,
                  members: ws.members?.filter(m => !userIds.includes(m.userId)) || []
                }
                : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? {
                  ...state.currentWorkspace,
                  members: state.currentWorkspace.members?.filter(m => !userIds.includes(m.userId)) || []
                }
                : state.currentWorkspace,
            isLoading: false,
            error: null,
          }));
        } catch (error: any) {
          console.error("Remove Member Error:", error);
          set({
            error: error.response?.data?.message || "Failed to remove member",
            isLoading: false,
          });
          throw error;
        }
      },

      // ========== WORKSPACE CUSTOM FIELD CONFIG ACTIONS ==========
      fetchWorkspaceCustomFieldsConfig: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const fields = await getWorkspaceCustomFields(workspaceId);
          set((state) => ({
            workspaceCustomFieldsConfig: {
              ...state.workspaceCustomFieldsConfig,
              [workspaceId]: fields
            },
            isLoading: false,
            error: null
          }));
        } catch (error: any) {
          console.error("Fetch Workspace Custom Fields Error:", error);
          set({
            error: error.response?.data?.message || "Failed to fetch workspace custom fields",
            isLoading: false,
          });
        }
      },

      addWorkspaceCustomFieldConfig: async (workspaceId: string, fieldData) => {
        set({ isLoading: true, error: null });
        try {
          const newField = await createWorkspaceCustomField(workspaceId, fieldData);

          set((state) => ({
            workspaceCustomFieldsConfig: {
              ...state.workspaceCustomFieldsConfig,
              [workspaceId]: [
                ...(state.workspaceCustomFieldsConfig[workspaceId] || []),
                newField
              ]
            },
            isLoading: false,
            error: null
          }));

          return newField;
        } catch (error: any) {
          console.error("Add Workspace Custom Field Error:", error);
          set({
            error: error.response?.data?.message || "Failed to add workspace custom field",
            isLoading: false,
          });
          throw error;
        }
      },

      updateWorkspaceCustomFieldConfig: async (workspaceId: string, fieldId: string, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updatedField = await updateWorkspaceCustomField(workspaceId, fieldId, updates);

          set((state) => ({
            workspaceCustomFieldsConfig: {
              ...state.workspaceCustomFieldsConfig,
              [workspaceId]: state.workspaceCustomFieldsConfig[workspaceId]?.map(field =>
                field._id === fieldId ? updatedField : field
              ) || []
            },
            isLoading: false,
            error: null
          }));
        } catch (error: any) {
          console.error("Update Workspace Custom Field Error:", error);
          set({
            error: error.response?.data?.message || "Failed to update workspace custom field",
            isLoading: false,
          });
          throw error;
        }
      },

      deleteWorkspaceCustomFieldConfig: async (workspaceId: string, fieldId: string) => {
        set({ isLoading: true, error: null });
        try {
          await deleteWorkspaceCustomField(workspaceId, fieldId);

          set((state) => ({
            workspaceCustomFieldsConfig: {
              ...state.workspaceCustomFieldsConfig,
              [workspaceId]: state.workspaceCustomFieldsConfig[workspaceId]?.filter(
                field => field._id !== fieldId
              ) || []
            },
            isLoading: false,
            error: null
          }));
        } catch (error: any) {
          console.error("Delete Workspace Custom Field Error:", error);
          set({
            error: error.response?.data?.message || "Failed to delete workspace custom field",
            isLoading: false,
          });
          throw error;
        }
      },

      // ========== CUSTOM FIELD ACTIONS ==========
      addCustomField: (workspaceId, field) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                ...ws,
                customFields: [...(ws.customFields || []), field]
              }
              : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? {
                ...state.currentWorkspace,
                customFields: [...(state.currentWorkspace.customFields || []), field]
              }
              : state.currentWorkspace,
        }));
      },

      updateCustomField: (workspaceId, fieldId, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                ...ws,
                customFields: ws.customFields?.map((f) =>
                  f.id === fieldId ? { ...f, ...updates } : f
                )
              }
              : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? {
                ...state.currentWorkspace,
                customFields: state.currentWorkspace.customFields?.map((f) =>
                  f.id === fieldId ? { ...f, ...updates } : f
                )
              }
              : state.currentWorkspace,
        }));
      },

      deleteCustomField: (workspaceId, fieldId) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                ...ws,
                customFields: ws.customFields?.filter((f) => f.id !== fieldId)
              }
              : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? {
                ...state.currentWorkspace,
                customFields: state.currentWorkspace.customFields?.filter((f) => f.id !== fieldId)
              }
              : state.currentWorkspace,
        }));
      },

      // ========== LABEL ACTIONS ==========
      addLabel: async (workspaceId, labelData) => {
        set({ isLoading: true, error: null });
        try {
          const newLabel = await labelsApi.createLabel(workspaceId, labelData);
          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId
                ? {
                  ...ws,
                  labels: [...(ws.labels || []), newLabel]
                }
                : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? {
                  ...state.currentWorkspace,
                  labels: [...(state.currentWorkspace.labels || []), newLabel]
                }
                : state.currentWorkspace,
            isLoading: false,
          }));
          return newLabel;
        } catch (error: any) {
          console.error("Add Label Error:", error);
          set({
            error: error.response?.data?.message || "Failed to add label",
            isLoading: false,
          });
          throw error;
        }
      },

      updateLabel: async (workspaceId, labelId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updatedLabel = await labelsApi.updateLabel(workspaceId, labelId, updates);
          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId
                ? {
                  ...ws,
                  labels: ws.labels?.map((l) =>
                    l.id === labelId ? { ...l, ...updatedLabel } : l
                  )
                }
                : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? {
                  ...state.currentWorkspace,
                  labels: state.currentWorkspace.labels?.map((l) =>
                    l.id === labelId ? { ...l, ...updatedLabel } : l
                  )
                }
                : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error("Update Label Error:", error);
          set({
            error: error.response?.data?.message || "Failed to update label",
            isLoading: false,
          });
        }
      },

      deleteLabel: async (workspaceId, labelId) => {
        set({ isLoading: true, error: null });
        try {
          await labelsApi.deleteLabel(workspaceId, labelId);
          set((state) => ({
            workspaces: state.workspaces.map((ws) =>
              ws.id === workspaceId
                ? {
                  ...ws,
                  labels: ws.labels?.filter((l) => l.id !== labelId)
                }
                : ws
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? {
                  ...state.currentWorkspace,
                  labels: state.currentWorkspace.labels?.filter((l) => l.id !== labelId)
                }
                : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error("Delete Label Error:", error);
          set({
            error: error.response?.data?.message || "Failed to delete label",
            isLoading: false,
          });
        }
      },

      // ========== PROJECT PHASE ACTIONS ========== //

      fetchProjectPhases: async (workspaceId: string) => {
        set({ isLoadingPhases: true });
        try {
          const phases = await getProjectPhasesApi(workspaceId);
          set({ projectPhases: phases });
        } finally {
          set({ isLoadingPhases: false });
        }
      },

      addProjectPhase: async (workspaceId: string, data: {
        label: string; color: string; description?: string;
      }) => {
        const phases = get().projectPhases;
        const order = phases.length + 1;
        const value = data.label.toLowerCase().replace(/\s+/g, '_');

        const updated = await createProjectPhaseApi(workspaceId, {
          value, label: data.label, description: data.description || '', color: data.color, order
        });
        // API returns the new parent object — append it
        set({ projectPhases: [...phases, updated] });
      },

      addChildPhase: async (workspaceId: string, parentId: string, data: {
        label: string; color: string; description?: string;
      }) => {
        const parent = get().projectPhases.find(p => p._id === parentId);
        const order = (parent?.children?.length || 0) + 1;
        const value = data.label.toLowerCase().replace(/\s+/g, '_');

        // ✅ API returns ONLY the new child object, NOT the updated parent
        const newChild = await createChildProjectPhaseApi(workspaceId, parentId, {
          value,
          label: data.label,
          description: data.description || '',
          color: data.color,
          order,
        });

        // ✅ Manually append the child to the correct parent in store
        set(state => ({
          projectPhases: state.projectPhases.map(p =>
            p._id === parentId
              ? { ...p, children: [...(p.children || []), newChild] }
              : p
          )
        }));
      },

      updateProjectPhase: async (workspaceId: string, stateId: string, data: {
        label?: string; color?: string; description?: string;
      }) => {
        const updated = await updateProjectPhaseApi(workspaceId, stateId, data);
        set(state => ({
          projectPhases: state.projectPhases.map(p => p._id === stateId ? updated : p)
        }));
      },

      updateChildPhase: async (workspaceId: string, stateId: string, parentId: string, data: {
        label?: string; color?: string; description?: string;
      }) => {
        // ✅ Returns only the updated child object
        const updatedChild = await updateChildProjectPhaseApi(workspaceId, stateId, parentId, data);

        // ✅ Find the parent and replace the matching child
        set(state => ({
          projectPhases: state.projectPhases.map(p =>
            p._id === parentId
              ? {
                ...p,
                children: (p.children || []).map(c =>
                  c._id === stateId ? { ...c, ...updatedChild } : c
                )
              }
              : p
          )
        }));
      },

      deleteProjectPhase: async (workspaceId: string, stateId: string) => {
        await deleteProjectPhaseApi(workspaceId, stateId);
        set(state => ({
          projectPhases: state.projectPhases.filter(p => p._id !== stateId)
        }));
      },

      deleteChildPhase: async (workspaceId: string, stateId: string, parentId: string) => {
        await deleteChildProjectPhaseApi(workspaceId, stateId, parentId);
        set(state => ({
          projectPhases: state.projectPhases.map(p =>
            p._id === parentId
              ? { ...p, children: (p.children || []).filter(c => c._id !== stateId) }
              : p
          )
        }));
      },

      // ========== UTILITY ACTIONS ==========

      setLoading: (isLoading) => set({ isLoading }),

      setIsWorkspaceSwitching: (isWorkspaceSwitching) => set({ isWorkspaceSwitching }),

      setError: (error) => set({ error, isLoading: false }),

      clearError: () => set({ error: null }),

      clearWorkspaces: () =>
        set({
          workspaces: [],
          currentWorkspace: null,
          error: null,
          isLoading: false,
        }),

      reset: () => {
        // Clear the persisted localStorage key
        localStorage.removeItem('workspace-storage');
      },
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspace: state.currentWorkspace,
        workspaceCustomFieldsConfig: state.workspaceCustomFieldsConfig,
        projectPhases: state.projectPhases,
      }),
    }
  )
);
