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
  fetchActivityLogs: (userId: string, page?: number, limit?: number) => Promise<void>;
  fetchTeamActivityLogs: (teamId: string, page?: number, limit?: number) => Promise<void>;
  fetchProjectActivityLogs: (projectId: string, page?: number, limit?: number) => Promise<void>;
  fetchPortfolioActivityLogs: (portfolioId: string, page?: number, limit?: number) => Promise<void>;
  fetchTaskActivityLogs: (taskId: string, page?: number, limit?: number) => Promise<void>;
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

const parseActivityLogsResponse = (response: any) => {
  if (!response) {
    return {
      results: [],
      total: 0,
      perPage: 10,
      currentPage: 1,
      pageCount: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  // Handle both unwrapped (response.results) and nested wrapped (response.data.results) formats
  const results = response.results || response.data?.results || [];
  const total = response.total !== undefined ? response.total : (response.data?.total !== undefined ? response.data.total : results.length);
  const perPage = response.perPage || response.data?.perPage || 10;
  const currentPage = response.currentPage || response.data?.currentPage || 1;
  const pageCount = response.pageCount || response.data?.pageCount || 1;
  const hasNextPage = response.paginator?.hasNextPage || response.data?.paginator?.hasNextPage || false;
  const hasPrevPage = response.paginator?.hasPrevPage || response.data?.paginator?.hasPrevPage || false;

  return {
    results,
    total,
    perPage,
    currentPage,
    pageCount,
    hasNextPage,
    hasPrevPage,
  };
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

  fetchActivityLogs: async (userId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchActivityLogsByActor(userId, page, limit);
      console.log("store actor response", response);

      const members = useWorkspaceStore.getState().workspaceMembers || [];
      console.log("store workspaceMembers", members);

      const parsed = parseActivityLogsResponse(response);
      const enriched = attachMembers(parsed.results, members);

      set({
        activityLogs: enriched,
        total: parsed.total,
        perPage: parsed.perPage,
        currentPage: parsed.currentPage,
        pageCount: parsed.pageCount,
        hasNextPage: parsed.hasNextPage,
        hasPrevPage: parsed.hasPrevPage,
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

  fetchTeamActivityLogs: async (teamId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchActivityLogsByTeam(teamId, page, limit);

      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const parsed = parseActivityLogsResponse(response);
      const enriched = attachMembers(parsed.results, members);

      set({
        activityLogs: enriched,
        total: parsed.total,
        perPage: parsed.perPage,
        currentPage: parsed.currentPage,
        pageCount: parsed.pageCount,
        hasNextPage: parsed.hasNextPage,
        hasPrevPage: parsed.hasPrevPage,
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
  fetchProjectActivityLogs: async (projectId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchActivityLogsByProject(projectId, page, limit);
      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const parsed = parseActivityLogsResponse(response);
      const enriched = attachMembers(parsed.results, members);

      set({
        activityLogs: enriched,
        total: parsed.total,
        perPage: parsed.perPage,
        currentPage: parsed.currentPage,
        pageCount: parsed.pageCount,
        hasNextPage: parsed.hasNextPage,
        hasPrevPage: parsed.hasPrevPage,
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

  fetchPortfolioActivityLogs: async (portfolioId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchActivityLogsByPortfolio(portfolioId, page, limit);
      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const parsed = parseActivityLogsResponse(response);
      const enriched = attachMembers(parsed.results, members);

      set({
        activityLogs: enriched,
        total: parsed.total,
        perPage: parsed.perPage,
        currentPage: parsed.currentPage,
        pageCount: parsed.pageCount,
        hasNextPage: parsed.hasNextPage,
        hasPrevPage: parsed.hasPrevPage,
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

  fetchTaskActivityLogs: async (taskId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchActivityLogsByTask(taskId, page, limit);
      const members = useWorkspaceStore.getState().workspaceMembers || [];
      const parsed = parseActivityLogsResponse(response);
      const enriched = attachMembers(parsed.results, members);

      set({
        activityLogs: enriched,
        total: parsed.total,
        perPage: parsed.perPage,
        currentPage: parsed.currentPage,
        pageCount: parsed.pageCount,
        hasNextPage: parsed.hasNextPage,
        hasPrevPage: parsed.hasPrevPage,
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
