// src/stores/activity-log-store.ts
import { create } from "zustand";
import {
  fetchActivityLogsByActor,
  fetchActivityLogsByTeam,
  fetchActivityLogsByProject,
  fetchActivityLogsByPortfolio,
  fetchActivityLogsByTask,
} from "@/lib/api/activity-log-api";
import {
  TeamActivityLogItem,
  TeamActivityLogsResponse,
  ActivityLogActor,
} from "@/types/activity-log.types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { WorkspaceMember } from "@/types/workspace.types";

interface ActivityLogState {
  activityLogs: TeamActivityLogItem[];
  total: number;
  perPage: number;
  currentPage: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  loading: boolean;
  error: string | null;
  fetchActivityLogs: (userId: string) => Promise<void>;
  fetchTeamActivityLogs: (teamId: string) => Promise<void>;
  fetchProjectActivityLogs: (projectId: string) => Promise<void>;
  fetchPortfolioActivityLogs: (portfolioId: string) => Promise<void>;
  fetchTaskActivityLogs: (taskId: string) => Promise<void>;
  clearLogs: () => void;
  reset: () => void;
}

// join logs with workspace members
const attachMembers = (
  logs: TeamActivityLogItem[],
  members: WorkspaceMember[]
): TeamActivityLogItem[] => {
  return logs.map((log) => {
    const member = members.find((m) => m.userId === log.actionBy);

    const actor: ActivityLogActor | undefined = member
      ? {
        id: member.userId,
        name: member.name,
        email: member.email,
        avatar: member.profilePicture ?? member.avatar ?? null,
        role: member.role,
      }
      : undefined;

    const d = new Date(log.time);
    const dateOnly = d.toLocaleDateString("en-GB");
    const timeOnly = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { ...log, actor, dateOnly, timeOnly };
  });
};

export const useActivityLogStore = create<ActivityLogState>((set) => ({
  activityLogs: [],
  total: 0,
  perPage: 10,
  currentPage: 1,
  pageCount: 1,
  hasNextPage: false,
  hasPrevPage: false,
  loading: false,
  error: null,

  fetchActivityLogs: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response: TeamActivityLogsResponse = await fetchActivityLogsByActor(userId);
      console.log("store actor response", response);

      const members = useWorkspaceStore.getState().workspaceMembers || [];
      console.log("store workspaceMembers", members);

      const enriched = attachMembers(response?.results ?? [], members);

      set({
        activityLogs: enriched,
        total: response?.total ?? enriched.length,
        perPage: response?.perPage ?? 10,
        currentPage: response?.currentPage ?? 1,
        pageCount: response?.pageCount ?? 1,
        hasNextPage: response?.paginator?.hasNextPage ?? false,
        hasPrevPage: response?.paginator?.hasPrevPage ?? false,
        loading: false,
      });
    } catch (error: any) {
      console.error("fetchActivityLogs error", error);
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch activity logs",
        loading: false,
        activityLogs: [],
      });
    }
  },

  fetchTeamActivityLogs: async (teamId: string) => {
    set({ loading: true, error: null });
    try {
      const response: TeamActivityLogsResponse = await fetchActivityLogsByTeam(teamId);

      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const enriched = attachMembers(response?.results ?? [], members);

      set({
        activityLogs: enriched,
        total: response?.total ?? enriched.length,
        perPage: response?.perPage ?? 10,
        currentPage: response?.currentPage ?? 1,
        pageCount: response?.pageCount ?? 1,
        hasNextPage: response?.paginator?.hasNextPage ?? false,
        hasPrevPage: response?.paginator?.hasPrevPage ?? false,
        loading: false,
      });
    } catch (err: any) {
      console.error("fetchTeamActivityLogs error", err);
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch team activity logs",
        loading: false,
        activityLogs: [],
      });
    }
  },
  fetchProjectActivityLogs: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const response: TeamActivityLogsResponse = await fetchActivityLogsByProject(projectId);
      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const enriched = attachMembers(response?.results ?? [], members);

      set({
        activityLogs: enriched,
        total: response?.total ?? enriched.length,
        perPage: response?.perPage ?? 10,
        currentPage: response?.currentPage ?? 1,
        pageCount: response?.pageCount ?? 1,
        hasNextPage: response?.paginator?.hasNextPage ?? false,
        hasPrevPage: response?.paginator?.hasPrevPage ?? false,
        loading: false,
      });
    } catch (err: any) {
      console.error("fetchProjectActivityLogs error", err);
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch project activity logs",
        loading: false,
        activityLogs: [],
      });
    }
  },

  fetchPortfolioActivityLogs: async (portfolioId: string) => {
    set({ loading: true, error: null });
    try {
      const response: TeamActivityLogsResponse = await fetchActivityLogsByPortfolio(portfolioId);
      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const enriched = attachMembers(response?.results ?? [], members);

      set({
        activityLogs: enriched,
        total: response?.total ?? enriched.length,
        perPage: response?.perPage ?? 10,
        currentPage: response?.currentPage ?? 1,
        pageCount: response?.pageCount ?? 1,
        hasNextPage: response?.paginator?.hasNextPage ?? false,
        hasPrevPage: response?.paginator?.hasPrevPage ?? false,
        loading: false,
      });
    } catch (err: any) {
      console.error("fetchPortfolioActivityLogs error", err);
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch portfolio activity logs",
        loading: false,
        activityLogs: [],
      });
    }
  },

  fetchTaskActivityLogs: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const response: TeamActivityLogsResponse = await fetchActivityLogsByTask(taskId);
      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const enriched = attachMembers(response?.results ?? [], members);

      set({
        activityLogs: enriched,
        total: response?.total ?? enriched.length,
        perPage: response?.perPage ?? 10,
        currentPage: response?.currentPage ?? 1,
        pageCount: response?.pageCount ?? 1,
        hasNextPage: response?.paginator?.hasNextPage ?? false,
        hasPrevPage: response?.paginator?.hasPrevPage ?? false,
        loading: false,
      });
    } catch (err: any) {
      console.error("fetchTaskActivityLogs error", err);
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch task activity logs",
        loading: false,
        activityLogs: [],
      });
    }
  },

  clearLogs: () =>
    set({
      activityLogs: [],
      total: 0,
      hasNextPage: false,
      hasPrevPage: false,
      error: null,
    }),

  reset: () =>
  {localStorage.removeItem('activity-storage');  }
}));
