// stores/portfolios-store.ts
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "@/components/ui/sonner";
import * as portfolioApi from "@/lib/api/portfolio-api";

export interface View {
  id: string;
  name: string;
  type: 'overview' | 'list' | 'calendar' | 'kanban' | 'gantt' | 'form' | 'attachments' | 'notes' | 'listTree' | 'whiteboard' | 'discussions' | 'timeline';
  projectId: string;
  isDefault?: boolean;
  order?: number;
  category?: 'default' | 'custom';
  icon?: string;
}



export interface Portfolio {
  id: string;
  name: string;
  identifier?: string;
  description?: string;
  color?: string;
  icon?: {
    iconId?: string | null;
    type?: "icon" | "file";
    name?: string;
    color?: string;
    presignedUrl?: string | null;
  } | null;
  iconId?: string | null;
  startDate?: string;
  endDate?: string;
  projectCount?: number;
  privacy?: "private" | "public";
  owner?: string;
  leaders?: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: "open" | "closed" | "archived";
  priority?: "low" | "medium" | "high" | "urgent";
  projects?: string[];
  viewers?: portfolioApi.PortfolioViewer[];
  workflowPermission?: "Me" | "Admins" | "Everyone";
  membershipPermission?: "Me" | "Admins" | "Everyone";
  fieldsPermission?: "Me" | "Admins" | "Everyone";
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: "file";
    status: "completed";
    createdAt: string;
    updatedAt: string;
    uploadedBy: string;
  }>;
}

interface PortfoliosState {
  portfolios: Portfolio[];
  fieldVisibility: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
  // CRUD
  fetchPortfolios: (workspaceId?: string) => Promise<void>;
  fetchPortfolioById: (id: string) => Promise<void>;
  addPortfolio: (portfolio: portfolioApi.CreatePortfolioPayload) => Promise<portfolioApi.PortfolioResponse>;
  updatePortfolio: (id: string, payload: portfolioApi.UpdatePortfolioPayload) => Promise<void>;
  removePortfolio: (id: string) => void;
  getPortfolioById: (id: string) => Portfolio | undefined;
  // Rename / Status / Priority / Dates
  renamePortfolio: (id: string, newName: string) => Promise<void>;
  updatePortfolioDescription: (id: string, description: string) => Promise<void>;
  updatePortfolioStatus: (id: string, status: Portfolio["status"]) => Promise<void>;
  updatePortfolioPriority: (id: string, priority: string) => Promise<void>;
  updatePortfolioDates: (id: string, startDate?: string, endDate?: string) => Promise<void>;
  // Icon
  updatePortfolioIcon: (portfolioId: string, iconId: string, iconData?: any) => Promise<void>;
  // Viewers
  addViewersToPortfolio: (portfolioId: string, viewerIds: string[]) => Promise<void>;
  removeViewersFromPortfolio: (portfolioId: string, viewerIds: string[]) => Promise<void>;
  // Attachments
  attachUploadsToPortfolio: (portfolioId: string, uploadIds: string[]) => Promise<void>;
  removeUploadsFromPortfolio: (portfolioId: string, uploadIds: string[]) => Promise<void>;
  // Projects
  addProjectsToPortfolio: (portfolioId: string, projectIds: string[]) => void;
  removeProjectFromPortfolio: (portfolioId: string, projectId: string) => void;
  // Archive / Delete
  archivePortfolio: (portfolioId: string) => Promise<void>;
  deletePortfolio: (portfolioId: string) => Promise<void>;
  updatePortfolioLeaders: (portfolioId: string, leaderIds: string[]) => Promise<void>;
  // Views management
  activeViewIds: Record<string, string>;
  setActiveView: (portfolioId: string, viewId: string) => void;
  customViews: View[];
  fetchViews: (portfolioId: string) => Promise<void>;
  addView: (view: View) => Promise<void>;
  removeView: (viewId: string) => Promise<void>;
  // Field Visibility
  toggleFieldVisibility: (portfolioId: string, fieldId: string, viewType?: string) => void;
  setFieldVisibility: (portfolioId: string, fieldIds: string[], viewType?: string) => void;
  reset: () => void;
}

export const usePortfoliosStore = create<PortfoliosState>()(
  persist(
    (set, get) => ({
      portfolios: [],
      fieldVisibility: {},
      activeViewIds: {},
      customViews: [],
      isLoading: false,
      error: null,

      setActiveView: (portfolioId, viewId) =>
        set((state) => ({
          activeViewIds: { ...state.activeViewIds, [portfolioId]: viewId },
        })),

      fetchViews: async (portfolioId) => {
        // placeholder for API
        console.log("Fetching views for portfolio:", portfolioId);
      },

      addView: async (view) => {
        set((state) => ({
          customViews: [...state.customViews.filter(v => v.projectId !== view.projectId), view]
        }));
      },

      removeView: async (viewId) => {
        set((state) => ({
          customViews: state.customViews.filter((v) => v.id !== viewId),
        }));
      },

      toggleFieldVisibility: (portfolioId, fieldId, viewType = "list") => {
        set((state) => {
          const key = `${portfolioId}-${viewType}`;
          const currentVisible = state.fieldVisibility[key] || ["id", "name", "phase", "status", "leaders", "members", "viewers", "priority", "startDate", "endDate"];
          const nextVisible = currentVisible.includes(fieldId)
            ? currentVisible.filter((id) => id !== fieldId)
            : [...currentVisible, fieldId];
          return {
            fieldVisibility: { ...state.fieldVisibility, [key]: nextVisible },
          };
        });
      },

      setFieldVisibility: (portfolioId, fieldIds, viewType = "list") => {
        set((state) => ({
          fieldVisibility: { ...state.fieldVisibility, [`${portfolioId}-${viewType}`]: fieldIds },
        }));
      },

      fetchPortfolios: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
          const portfolios = await portfolioApi.getPortfolios(workspaceId);
          set({ portfolios, isLoading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || "Failed to fetch portfolios", isLoading: false });
        }
      },

      fetchPortfolioById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const portfolio = await portfolioApi.getPortfolioById(id);
          set((state) => ({
            portfolios: state.portfolios.some(p => p.id === id)
              ? state.portfolios.map(p => p.id === id ? portfolio : p)
              : [...state.portfolios, portfolio],
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.message || "Failed to fetch portfolio", isLoading: false });
        }
      },

      addPortfolio: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const newPortfolio = await portfolioApi.createPortfolio(payload);
          set((state) => ({
            portfolios: [...state.portfolios, newPortfolio],
            isLoading: false
          }));
          toast('success', { title: "Portfolio created successfully!" });
          return newPortfolio;
        } catch (error: any) {
          set({ error: error.response?.data?.message || "Failed to create portfolio", isLoading: false });
          toast('error', { title: "Failed to create portfolio" });
          throw error;
        }
      },

      updatePortfolio: async (id, payload) => {
        set({ isLoading: true });
        try {
          const updated = await portfolioApi.updatePortfolio(id, payload);
          set((state) => ({
            portfolios: state.portfolios.map((p) =>
              p.id === id ? updated : p
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ isLoading: false });
          toast('error', { title: "Failed to update portfolio" });
          throw error;
        }
      },

      removePortfolio: (id) =>
        set((state) => ({
          portfolios: state.portfolios.filter((p) => p.id !== id),
        })),

      getPortfolioById: (id) => get().portfolios.find((p) => p.id === id),

      renamePortfolio: async (id, newName) => {
        set({ isLoading: true });
        try {
          const updated = await portfolioApi.updatePortfolioDetailsPatchApi(id, { name: newName });
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === id ? updated : p)),
            isLoading: false,
          }));
          toast('success', { title: "Portfolio renamed successfully!" });
        } catch (error: any) {
          set({ isLoading: false });
          toast('error', { title: "Failed to rename portfolio" });
          throw error;
        }
      },

      updatePortfolioDescription: async (id, description) => {
        try {
          const updated = await portfolioApi.updatePortfolioDetailsPatchApi(id, { description });
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === id ? updated : p)),
          }));
        } catch (error: any) {
          toast('error', { title: "Failed to save description" });
          throw error;
        }
      },

      updatePortfolioStatus: async (id, status) => {
        try {
          const updated = await portfolioApi.updatePortfolioPropertiesPatchApi(id, { status });
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === id ? updated : p)),
          }));
          toast('success', { title: "Portfolio status updated!" });
        } catch (error: any) {
          toast('error', { title: "Failed to update status" });
          throw error;
        }
      },

      updatePortfolioPriority: async (id, priority) => {
        try {
          const updated = await portfolioApi.updatePortfolioPropertiesPatchApi(id, { priority });
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === id ? updated : p)),
          }));
          toast('success', { title: "Portfolio priority updated!" });
        } catch (error: any) {
          toast('error', { title: "Failed to update priority" });
        }
      },

      updatePortfolioDates: async (id, startDate, endDate) => {
        try {
          const updated = await portfolioApi.updatePortfolioDatesPatchApi(id, { startDate, endDate });
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === id ? updated : p)),
          }));
        } catch {
          toast('error', { title: "Failed to save portfolio dates" });
        }
      },

      updatePortfolioIcon: async (portfolioId, iconId, iconData) => {
        set({ isLoading: true });
        try {
          const updated = await portfolioApi.updatePortfolioIconPatchApi(portfolioId, iconId);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
            isLoading: false,
          }));
          toast('success', { title: "Portfolio icon updated!" });
        } catch (error: any) {
          set({ isLoading: false });
          toast('error', { title: "Failed to update icon" });
          throw error;
        }
      },

      addViewersToPortfolio: async (portfolioId, viewerIds) => {
        try {
          const updated = await portfolioApi.addViewersPatchApi(portfolioId, viewerIds);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('success', { title: "Viewers added!" });
        } catch (error: any) {
          toast('error', { title: "Failed to add viewers" });
          throw error;
        }
      },

      removeViewersFromPortfolio: async (portfolioId, viewerIds) => {
        try {
          const updated = await portfolioApi.removeViewersPatchApi(portfolioId, viewerIds);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('success', { title: "Viewer removed!" });
        } catch (error: any) {
          toast('error', { title: "Failed to remove viewer" });
          throw error;
        }
      },

      attachUploadsToPortfolio: async (portfolioId, uploadIds) => {
        try {
          const updated = await portfolioApi.attachUploadsPatchApi(portfolioId, uploadIds);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('info', { title: `${uploadIds.length} file${uploadIds.length > 1 ? "s" : ""} attached!` });
        } catch (error: any) {
          toast('error', { title: "Failed to attach files" });
          throw error;
        }
      },

      removeUploadsFromPortfolio: async (portfolioId, uploadIds) => {
        try {
          const updated = await portfolioApi.removeUploadsPatchApi(portfolioId, uploadIds);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('info', { title: "Attachment removed!" });
        } catch (error: any) {
          toast('error', { title: "Failed to remove attachment" });
          throw error;
        }
      },

      archivePortfolio: async (portfolioId) => {
        try {
          set((state) => ({
            portfolios: state.portfolios.map((p) =>
              p.id === portfolioId ? { ...p, status: "archived" } : p
            ),
          }));
          toast('success', { title: "Portfolio archived!" });
        } catch (error: any) {
          toast('error', { title: "Failed to archive portfolio" });
          throw error;
        }
      },

      deletePortfolio: async (portfolioId) => {
        try {
          set((state) => ({
            portfolios: state.portfolios.filter((p) => p.id !== portfolioId),
          }));
          toast('success', { title: "Portfolio deleted!" });
        } catch (error: any) {
          toast('error', { title: "Failed to delete portfolio" });
          throw error;
        }
      },

      addProjectsToPortfolio: async (portfolioId: string, projectIds: string[]) => {
        try {
          const updated = await portfolioApi.addProjectsPatchApi(portfolioId, projectIds);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('success', { title: `${projectIds.length} project${projectIds.length > 1 ? "s" : ""} linked!` });
        } catch (error: any) {
          toast('error', { title: "Failed to link projects" });
        }
      },

      removeProjectFromPortfolio: async (portfolioId: string, projectId: string) => {
        try {
          const updated = await portfolioApi.removeProjectsPatchApi(portfolioId, [projectId]);
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('success', { title: "Project removed from portfolio" });
        } catch (error: any) {
          toast('error', { title: "Failed to remove project" });
        }
      },

      updatePortfolioLeaders: async (portfolioId: string, leaderIds: string[]) => {
        try {
          const updated = await portfolioApi.updatePortfolioPropertiesPatchApi(portfolioId, { leaderIds });
          set((state) => ({
            portfolios: state.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
          }));
          toast('success', { title: "Portfolio leaders updated!" });
        } catch (error: any) {
          toast('error', { title: "Failed to update leaders" });
          throw error;
        }
      },

      reset: () => {
        set({
          portfolios: [],
          fieldVisibility: {},
          activeViewIds: {},
          customViews: [],
          isLoading: false,
          error: null,
        });
        localStorage.removeItem('portfolios-storage');
      },
    }),
    {
      name: "portfolios-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        portfolios: state.portfolios,
        activeViewIds: state.activeViewIds,
        customViews: state.customViews,
        fieldVisibility: state.fieldVisibility,
      }),
    }
  )
);