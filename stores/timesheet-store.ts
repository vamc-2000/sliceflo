// stores/timesheet-store.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { timesheetApi } from "@/lib/api/timesheet-api"; // Adjust path
import type {
  Timesheet,
  TimesheetWithUser,
  FetchTimesheetResponse,
  CreateTimesheetRequest,
  TimesheetStatus,
  SubmitTimesheetResponse,
  TimesheetActionResponse,
  ApproveTimesheetRequest,
  RejectTimesheetRequest,
  GetUserApproversResponse,
  UpdateRejectedWeekTimesheetsRequest,
  UpdateRejectedWeekTimesheetsResponse,
} from "@/types/timesheet.types";

interface TimesheetState {
  // Data
  timesheets: TimesheetWithUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;

  // Filters/Search
  weekStartFilter: string | null;
  search?: string;

  filters: {
    userId?: string;
    day?: string;
    weekStart?: string;
    status?: TimesheetStatus;
  };

  approvalQueue: TimesheetWithUser[];
  approvalPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;

  approvalWeekStartFilter: string | null;
  submitterCount: number;

  approvalFilters: {
    submittedUserId?: string;
    day?: string;
    weekStart?: string;
    status?: TimesheetStatus;
  };

  // UI state
  isTimesheetsLoading: boolean;
  isApprovalLoading: boolean;
  selectedUserApprovers: GetUserApproversResponse | null;
  isApproversLoading: boolean;
  error: string | null;

  // Actions
  fetchTimesheets: (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    day?: string;
    weekStart?: string;
    status?: TimesheetStatus;
    append?: boolean;
  }) => Promise<void>;
  createTimesheet: (data: CreateTimesheetRequest) => Promise<Timesheet | null>;
  addApprovers: (userId: string, approverIds: string[]) => Promise<boolean>;
  removeApprovers: (userId: string, approverId: string) => Promise<boolean>;
  fetchUserApprovers: (userId: string) => Promise<GetUserApproversResponse | null>;
  submitTimesheets: (
    weekStart: string,
    targetUserId: string
  ) => Promise<boolean>;
  fetchApprovalQueue: (params?: {
    page?: number;
    limit?: number;
    submittedUserId?: string;
    day?: string;
    weekStart?: string;
    status?: TimesheetStatus;
  }) => Promise<void>;
  approveTimesheets: (
    data: ApproveTimesheetRequest
  ) => Promise<boolean>;

  rejectTimesheets: (
    data: RejectTimesheetRequest
  ) => Promise<boolean>;
  updateRejectedWeekTimesheets: (
    data: UpdateRejectedWeekTimesheetsRequest
  ) => Promise<boolean>;

  updateTimesheet: (
    timesheetId: string,
    data: Partial<CreateTimesheetRequest>
  ) => Promise<boolean>;
  deleteTimesheet: (
    timesheetId: string,
  ) => Promise<boolean>;

  setFilter: (key: keyof TimesheetState['filters'], value: string | TimesheetStatus | undefined) => void;
  setApprovalFilter: (
    key: keyof TimesheetState['approvalFilters'],
    value: string | TimesheetStatus | undefined
  ) => void;
  clearFilters: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useTimesheetStore = create<TimesheetState>()(
  persist(
    (set, get) => ({
      timesheets: [],
      pagination: null,
      weekStartFilter: null,
      search: "",
      filters: {
        userId: undefined,
        day: undefined,
        weekStart: undefined,
        status: undefined,
      },
      approvalQueue: [],
      approvalPagination: null,
      approvalWeekStartFilter: null,
      submitterCount: 0,

      approvalFilters: {
        submittedUserId: undefined,
        day: undefined,
        weekStart: undefined,
        status: undefined,
      },
      isTimesheetsLoading: false,
      isApprovalLoading: false,
      selectedUserApprovers: null,
      isApproversLoading: false,
      error: null,

      fetchTimesheets: async (overrideParams?: Partial<{
        page: number;
        limit: number;
        userId: string;
        day: string;
        weekStart: string;
        status: TimesheetStatus;
        append?: boolean;
      }>) => {
        const state = get();
        const { append, ...otherParams } = overrideParams || {};

        const params = {
          page: 1, // Reset to page 1 on new filters
          limit: 20,
          ...state.filters,
          ...otherParams,
        };

        set({
          isTimesheetsLoading: true,
          error: null,
          filters: { ...state.filters, ...otherParams }, // Update stored filters
        });

        try {
          const response = await timesheetApi.getTimesheets(params);
          set((state) => {
            let newTimesheets = response.items;
            if (append) {
              newTimesheets = [...state.timesheets, ...response.items];
            } else if (response.weekStartFilter) {
              // Cache previous weeks so that calendar modals know their status
              const otherWeeks = state.timesheets.filter(t => t.weekStart !== response.weekStartFilter);
              newTimesheets = [...otherWeeks, ...response.items];
            }
            
            return {
              timesheets: newTimesheets,
              pagination: response.pagination,
              weekStartFilter: response.weekStartFilter,
            };
          });
        } catch (err: any) {
          set({ error: err.message || "Failed to fetch timesheets" });
          throw err;
        } finally {
          set({ isTimesheetsLoading: false });
        }
      },

      // New filter actions
      setFilter: (key: keyof TimesheetState['filters'], value: string | TimesheetStatus | undefined) => {
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        }));
        get().fetchTimesheets({ page: 1 }); // Refetch with new filter
      },

      setApprovalFilter: (key, value) => {
        set((state) => ({
          approvalFilters: { ...state.approvalFilters, [key]: value },
        }));

        get().fetchApprovalQueue({ page: 1 });
      },

      clearFilters: () => {
        set({ filters: {} });
        get().fetchTimesheets({ page: 1 });
      },

      createTimesheet: async (data: CreateTimesheetRequest) => {
        try {
          const response = await timesheetApi.createTimesheet(data);

          // Handle both wrapped { success, data } and direct { ...timesheet } responses
          const timesheetData = (response as any).success ? (response as any).data : response;

          if (timesheetData && timesheetData.id) {
            // Add userProfile from existing timesheets or leave undefined
            const userProfile = get().timesheets.find(
              (t) => t.userId === timesheetData.userId
            )?.userProfile;

            const newSheet: TimesheetWithUser = {
              ...timesheetData,
              userProfile,  // Copy from existing or undefined
            };

            set((state) => ({
              timesheets: [newSheet, ...state.timesheets],
              pagination: state.pagination
                ? {
                  ...state.pagination,
                  total: state.pagination.total + 1
                }
                : null,
            }));
            return timesheetData;
          }
          return null;
        } catch (err: any) {
          set({ error: err.message || "Failed to create timesheet" });
          return null;
        }
      },

      addApprovers: async (userId: string, approverIds: string[]) => {
        try {
          set({ error: null });

          await timesheetApi.addApprovers(userId, approverIds);

          // 🔹 Update local timesheets for that user
          set((state) => ({
            timesheets: state.timesheets.map((t) =>
              t.userId === userId
                ? { ...t, approverIds }
                : t
            ),
          }));
          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to add approvers" });
          return false;
        }
      },

      removeApprovers: async (userId: string, approverId: string) => {
        try {
          set({ error: null });

          await timesheetApi.removeApprovers(userId, approverId);

          set((state) => ({
            timesheets: state.timesheets.map((t) =>
              t.userId === userId
                ? {
                    ...t,
                    approverIds: t.approverIds ? t.approverIds.filter((id) => id !== approverId) : [],
                  }
                : t
            ),
            selectedUserApprovers:
              state.selectedUserApprovers && state.selectedUserApprovers.userId === userId
                ? {
                    ...state.selectedUserApprovers,
                    timesheetApprovers: state.selectedUserApprovers.timesheetApprovers
                      ? state.selectedUserApprovers.timesheetApprovers.filter((id) => id !== approverId)
                      : [],
                    approvers: state.selectedUserApprovers.approvers
                      ? state.selectedUserApprovers.approvers.filter((a: any) => a.id !== approverId)
                      : [],
                  }
                : state.selectedUserApprovers,
          }));
          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to remove approver" });
          return false;
        }
      },

      fetchUserApprovers: async (userId: string) => {
        try {
          set({ isApproversLoading: true, error: null });

          const response = await timesheetApi.getApproversByUserId(userId);

          set({
            selectedUserApprovers: response,
          });

          return response;
        } catch (err: any) {
          set({ error: err.message || "Failed to fetch approvers" });
          return null;
        } finally {
          set({ isApproversLoading: false });
        }
      },

      submitTimesheets: async (weekStart: string, targetUserId: string) => {
        try {
          set({ isTimesheetsLoading: true, error: null });

          const response: SubmitTimesheetResponse =
            await timesheetApi.submitTimesheets({
              weekStart,
              targetUserId,
            });

          const updatedMap = new Map(response.items.map(i => [i.id, i]));

          set((state) => ({
            timesheets: state.timesheets.map((t) =>
              updatedMap.has(t.id) ? updatedMap.get(t.id)! : t
            ),
          }));

          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to submit timesheets" });
          return false;
        } finally {
          set({ isTimesheetsLoading: false });
        }
      },

      fetchApprovalQueue: async (overrideParams?: Partial<{
        page: number;
        limit: number;
        submittedUserId: string;
        day: string;
        weekStart: string;
        status: TimesheetStatus;
      }>) => {
        const state = get();

        const params = {
          page: 1,
          limit: 20,
          ...state.approvalFilters,
          ...overrideParams,
        };

        set({
          isApprovalLoading: true,
          error: null,
          approvalFilters: { ...state.approvalFilters, ...overrideParams },
        });

        try {
          const response = await timesheetApi.getApprovalQueue(params);

          set({
            approvalQueue: response.items,
            approvalPagination: response.pagination,
            approvalWeekStartFilter: response.weekStartFilter,
            submitterCount: response.submitterCount,
          });
        } catch (err: any) {
          set({ error: err.message || "Failed to fetch approval queue" });
          throw err;
        } finally {
          set({ isApprovalLoading: false });
        }
      },

      approveTimesheets: async (data) => {
        try {
          set({ isApprovalLoading: true, error: null });

          const response: TimesheetActionResponse =
            await timesheetApi.approveTimesheets(data);

          if (response.modifiedCount > 0) {
            const updatedMap = new Map(response.items.map(i => [i.id, i]));

            set((state) => ({
              approvalQueue: state.approvalQueue.map((t) =>
                updatedMap.has(t.id)
                  ? {
                    ...updatedMap.get(t.id)!,
                    userProfile: t.userProfile, // ✅ Keep the existing userProfile
                  }
                  : t
              ),
              timesheets: state.timesheets.map((t) =>
                updatedMap.has(t.id)
                  ? {
                    ...updatedMap.get(t.id)!,
                    userProfile: t.userProfile, // ✅ Same fix for main timesheets
                  }
                  : t
              ),
            }));
          }
          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to approve timesheets" });
          return false;
        } finally {
          set({ isApprovalLoading: false });
        }
      },

      rejectTimesheets: async (data) => {
        try {
          set({ isApprovalLoading: true, error: null });

          const response: TimesheetActionResponse =
            await timesheetApi.rejectTimesheets(data);

          if (response.modifiedCount > 0) {
            const updatedMap = new Map(response.items.map(i => [i.id, i]));

            set((state) => ({
              approvalQueue: state.approvalQueue.map((t) =>
                updatedMap.has(t.id)
                  ? {
                    ...updatedMap.get(t.id)!,
                    userProfile: t.userProfile,
                  }
                  : t
              ),

              timesheets: state.timesheets.map((t) =>
                updatedMap.has(t.id)
                  ? {
                    ...updatedMap.get(t.id)!,
                    userProfile: t.userProfile,
                  }
                  : t
              ),
            }));
          }
          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to reject timesheets" });
          return false;
        } finally {
          set({ isApprovalLoading: false });
        }
      },

      updateRejectedWeekTimesheets: async (
        data: UpdateRejectedWeekTimesheetsRequest
      ) => {
        try {
          set({ isTimesheetsLoading: true, error: null });

          const response: UpdateRejectedWeekTimesheetsResponse =
            await timesheetApi.updateRejectedWeekTimesheets(data);

          const updatedMap = new Map(response.items.map((item) => [item.id, item]));

          set((state) => ({
            timesheets: state.timesheets.map((t) =>
              updatedMap.has(t.id)
                ? {
                  ...updatedMap.get(t.id)!,
                  userProfile:
                    updatedMap.get(t.id)!.userProfile ?? t.userProfile,
                }
                : t
            ),
            approvalQueue: state.approvalQueue.map((t) =>
              updatedMap.has(t.id)
                ? {
                  ...updatedMap.get(t.id)!,
                  userProfile:
                    updatedMap.get(t.id)!.userProfile ?? t.userProfile,
                }
                : t
            ),
            weekStartFilter: response.weekStart,
          }));

          return true;
        } catch (err: any) {
          set({
            error: err.message || "Failed to update rejected week timesheets",
          });
          return false;
        } finally {
          set({ isTimesheetsLoading: false });
        }
      },

      updateTimesheet: async (timesheetId, data) => {
        try {
          set({ error: null });

          const response = await timesheetApi.updateTimesheet(timesheetId, data);

          // Handle wrapped or direct response
          const updatedTimesheet = (response as any).success
            ? (response as any).data
            : response;

          if (updatedTimesheet && updatedTimesheet.id) {
            set((state) => ({
              timesheets: state.timesheets.map((t) =>
                t.id === timesheetId
                  ? {
                    ...t,
                    ...updatedTimesheet,
                    userProfile: t.userProfile, // ✅ preserve existing userProfile
                  }
                  : t
              ),

              // Also update approval queue if exists there
              approvalQueue: state.approvalQueue.map((t) =>
                t.id === timesheetId
                  ? {
                    ...t,
                    ...updatedTimesheet,
                    userProfile: t.userProfile,
                  }
                  : t
              ),
            }));
          }

          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to update timesheet" });
          return false;
        }
      },

      deleteTimesheet: async (timesheetId) => {
        try {
          set({ error: null });

          await timesheetApi.deleteTimesheet(timesheetId);

          set((state) => ({
            timesheets: state.timesheets.filter((t) => t.id !== timesheetId),
            approvalQueue: state.approvalQueue.filter((t) => t.id !== timesheetId),
          }));

          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to delete timesheet" });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      reset: () => {
        // Clear the persisted localStorage key
        localStorage.removeItem('timesheet-storage');
      },

    }),
    {
      name: "timesheet-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        timesheets: state.timesheets,
        weekStartFilter: state.weekStartFilter,
        search: state.search,
        filters: state.filters,
      }),
    }
  )
);
