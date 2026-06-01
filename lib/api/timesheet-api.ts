import axiosInstance from "./axios-instance";
import {
  CreateTimesheetRequest,
  TimesheetApiResponse,
  FetchTimesheetResponse,
  TimesheetStatus,
  SubmitTimesheetResponse,
  ApprovalQueueResponse,
  ApprovalQueueParams,
  ApproveTimesheetRequest,
  RejectTimesheetRequest,
  TimesheetActionResponse,
  GetUserApproversResponse,
  UpdateRejectedWeekTimesheetsRequest,
  UpdateRejectedWeekTimesheetsResponse
} from "@/types/timesheet.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const timesheetApi = {
  // 🔹 Get all timesheets
  getTimesheets: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;        // Filter by user (approver/admin)
    day?: string;           // Filter by calendar day (ISO date)
    weekStart?: string;     // Filter by week start (Monday UTC, ISO date)
    status?: TimesheetStatus; // "Pending" | "Approved" | "Rejected"
  }): Promise<FetchTimesheetResponse> => {
    const query = new URLSearchParams({
      ...(params?.page && { page: params.page.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.userId && { userId: params.userId }),
      ...(params?.day && { day: params.day }),
      ...(params?.weekStart && { weekStart: params.weekStart }),
      ...(params?.status && { status: params.status }),
    }).toString();

    const url = query
      ? `${API_BASE_URL}/timesheets?${query}`
      : `${API_BASE_URL}/timesheets`;

    const response = await axiosInstance.get<FetchTimesheetResponse>(url);
    return response;
  },

  // 🔹 Create timesheet
  createTimesheet: async (
    data: CreateTimesheetRequest
  ): Promise<TimesheetApiResponse> => {
    const response = await axiosInstance.post<TimesheetApiResponse>(
      `${API_BASE_URL}/timesheets`,
      data
    );
    return response;
  },

  // 🔹 Add / Update Approvers for a User
  addApprovers: async (
    userId: string,
    approverIds: string[]
  ): Promise<any> => {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/timesheets/users/${userId}/approvers`,
      { approverIds }
    );
    return response;
  },

  // 🔹 Remove Approvers for a User
  removeApprovers: async (
    userId: string,
    approverId: string
  ): Promise<any> => {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/timesheets/users/${userId}/approvers/${approverId}`
    );
    return response;
  },

  submitTimesheets: async (
    data: {
      weekStart: string;
      targetUserId: string;
    }
  ): Promise<SubmitTimesheetResponse> => {
    const response = await axiosInstance.post<SubmitTimesheetResponse>(
      `${API_BASE_URL}/timesheets/week/submit`,
      data
    );
    return response;
  },

  // 🔹 Get Approval Queue (for approvers)
  getApprovalQueue: async (
    params?: ApprovalQueueParams
  ): Promise<ApprovalQueueResponse> => {
    const query = new URLSearchParams({
      ...(params?.page && { page: params.page.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.submittedUserId && {
        submittedUserId: params.submittedUserId,
      }),
      ...(params?.day && { day: params.day }),
      ...(params?.weekStart && { weekStart: params.weekStart }),
      ...(params?.status && { status: params.status }),
    }).toString();

    const url = query
      ? `${API_BASE_URL}/timesheets/approval-queue?${query}`
      : `${API_BASE_URL}/timesheets/approval-queue`;

    const response =
      await axiosInstance.get<ApprovalQueueResponse>(url);

    return response;
  },

  // 🔹 Approve Timesheets (week-level)
  approveTimesheets: async (
    data: ApproveTimesheetRequest
  ): Promise<TimesheetActionResponse> => {
    const response = await axiosInstance.post<TimesheetActionResponse>(
      `${API_BASE_URL}/timesheets/week/approve`,
      data
    );
    return response;
  },

  // 🔹 Get Approvers for a User
  getApproversByUserId: async (
    userId: string
  ): Promise<GetUserApproversResponse> => {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/timesheets/users/${userId}/approvers`
    );
    return response;
  },

  // 🔹 Reject Timesheets (week-level)
  rejectTimesheets: async (
    data: RejectTimesheetRequest
  ): Promise<TimesheetActionResponse> => {
    const response = await axiosInstance.post<TimesheetActionResponse>(
      `${API_BASE_URL}/timesheets/week/reject`,
      data
    );
    return response;
  },

  // 🔹 Update Rejected Week Timesheets
  updateRejectedWeekTimesheets: async (
    data: UpdateRejectedWeekTimesheetsRequest
  ): Promise<UpdateRejectedWeekTimesheetsResponse> => {
    const response = await axiosInstance.patch(
      `${API_BASE_URL}/timesheets/week/rejected`,
      data
    );
    return response;
  },

  // 🔹 Update (Edit) Timesheet Entry
  updateTimesheet: async (
    timesheetId: string,
    data: Partial<CreateTimesheetRequest>
  ): Promise<TimesheetApiResponse> => {
    const response = await axiosInstance.patch<TimesheetApiResponse>(
      `${API_BASE_URL}/timesheets/${timesheetId}`,
      data
    );
    return response;
  },

  deleteTimesheet: async (
    timesheetId: string,
  ): Promise<TimesheetApiResponse> => {
    const response = await axiosInstance.delete<TimesheetApiResponse>(
      `${API_BASE_URL}/timesheets/${timesheetId}`,
    );
    return response;
  },

};

