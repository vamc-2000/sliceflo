// src/types/activity-log.types.ts
export interface ActivityLogActor {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
  role?: string;
}

export interface TeamActivityLogItem {
  _id: string;
  resource: string;
  resourceId?: string;
  action: string;
  actionBy: string;
  time: string;
  message: string;
  changes?: Record<string, any>;
  tenant?: string;
  workspaceId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;

  // derived for UI
  actor?: ActivityLogActor;
  dateOnly?: string;
  timeOnly?: string;
}

export interface TeamActivityLogsResponse {
  results: TeamActivityLogItem[];
  total: number;
  perPage: number;
  currentPage: number;
  next: number | null;
  prev: number | null;
  pageCount: number;
  slNo: number;
  paginator: {
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
