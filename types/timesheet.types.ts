// 🔹 Status enum (strong typing)
export type TimesheetStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Rejected";

// 🔹 Main Timesheet model (response)
export interface Timesheet {
  id: string;
  tenantId: string;
  userId: string;

  date: string;        // YYYY-MM-DD
  weekStart: string;   // YYYY-MM-DD (start of week)

  timeSpentMinutes: number;

  taskId: string;
  projectId: string;

  notes?: string;
  freetext?: string;

  isOverTime: boolean;

  status: TimesheetStatus;

  approverIds: string[];

  approvalComment?: string;
  rejectedReason?: string;
  
  approvedAt?: string | null;
  rejectedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateTimesheetRequest {
  date: string;
  timeSpent: string;

  taskId: string;
  projectId: string;

  notes?: string;
  freetext?: string;

  isOverTime?: boolean;

  approverIds?: string[];
}

export interface TimesheetApiResponse {
  success: boolean;
  message?: string;
  data: Timesheet;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  profilePictureUrl: string | null;
  jobRole: string | null;
  about: string | null;
  pronouns: string | null;
  country: string | null;
  division: string | null;
  workPhone: string | null;
  personalPhone: string | null;
}

// Extend Timesheet if userProfile is always returned with GET
export interface TimesheetWithUser extends Timesheet {
  userProfile?: UserProfile;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FetchTimesheetResponse {
  items: TimesheetWithUser[];
  pagination: PaginationInfo;
  weekStartFilter: string | null;
}

export type SubmitTimesheetResponse = {
  modifiedCount: number;
  userProfile: UserProfile;
  items: TimesheetWithUser[];
};

export type ApprovalRow = {
  details: string;
  tracked: string;
  capacity: string;
  billable: string;
  overcapacity: string;
  status: "Approved" | "Rejected" | "Pending" | "Partially Approved";
  hasWarning?: boolean;
  hasEdit?: boolean;
  userId: string;
  weekStart: string;
  approverIds: string[];
};

export interface ApprovalQueueParams {
  page?: number;
  limit?: number;
  submittedUserId?: string;
  day?: string;
  weekStart?: string;
  status?: TimesheetStatus;
}

export interface ApprovalQueueResponse {
  items: TimesheetWithUser[];
  pagination: PaginationInfo;

  weekStartFilter: string | null;
  submitterCount: number;
}

export interface ApproveTimesheetRequest {
  targetUserId: string;
  weekStart: string;
  comment?: string;
}

export interface RejectTimesheetRequest {
  targetUserId: string;
  weekStart: string;
  comment?: string;
  reason?: string;
}

export interface TimesheetActionResponse {
  modifiedCount: number;
  message: string;
  userProfile: UserProfile;
  items: TimesheetWithUser[];
}

export interface TimesheetApprover {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  profilePictureUrl: string | null;
  jobRole: string | null;
  about: string | null;
  pronouns: string | null;
  country: string | null;
  division: string | null;
  workPhone: string | null;
  personalPhone: string | null;
}

export interface GetUserApproversResponse {
  userId: string;
  timesheetApprovers: string[];
  approvers: TimesheetApprover[];
}

export interface UpdateRejectedTimesheetEntry {
  id: string;
  timeSpent: string;
  taskId?: string;
  projectId?: string;
  notes?: string;
  freetext?: string;
}

export interface UpdateRejectedWeekTimesheetsRequest {
  weekStart: string;
  entries: UpdateRejectedTimesheetEntry[];
}

export interface UpdateRejectedWeekTimesheetsResponse {
  weekStart: string;
  userProfile: UserProfile;
  items: TimesheetWithUser[];
}