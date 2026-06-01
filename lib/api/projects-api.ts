// lib/api/projects-api.ts
import axiosInstance from "./axios-instance";
import { ProjectPriorityConfig, TaskPriorityConfig } from "@/stores/projects-store";

// ✅ Icon object structure from API
export interface ProjectIcon {
  iconId: string;
  type: "icon" | "file";
  name: string;
  color: string;
  presignedUrl?: string; // ✅ Add presignedUrl for file icons
}

// ✅ Updated response type matching your actual API
export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  slug: string;
  state?: string
  startDate?: string;
  endDate?: string;
  portfolioId?: string;
  linkedPortfolios?: string[];
  leaders?: string[];
  viewers?: string[];
  members?: Array<{ userId: string; role: string }>;
  status: string;
  priority?: string;
  privacy?: "public" | "private";
  customFields?: any[];
  customFieldValues?: Record<string, any>;
  customFieldsConfig?: any[]; // ✅ Add custom fields config to project response
  projectStatusConfig?: any[]; // ✅ Add project status config to project response
  projectPriorityConfig?: any[]; // ✅ Add project priority config to project response
  taskTypeConfig?: any[]; // ✅ Add task type config to project response
  taskStatusConfig?: any[]; // ✅ Add task status config to project response
  taskPriorityConfig?: any[]; // ✅ Add task priority config to project response
  iconId?: string;
  icon?: ProjectIcon | null; // ✅ Can be object or null
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
  labels?: Array<{ id: string; name: string; color: string }>; // ✅ Add labels
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  workspaceId?: string;
  ownerId?: string;
  cycleConfigs?: ParallelCycleConfig[];
  usesParallelCycleConfigs?: boolean;
}

// ✅ API returns wrapper object
export interface GetAllProjectsResponse {
  projects: ProjectResponse[];
}

// interface for the PATCH operation
export interface PatchProjectOperation {
  operation:
  | 'rename'
  | 'update_status'
  | 'update_priority'
  | 'add_viewers'
  | 'remove_viewers'
  | 'add_members'
  | 'remove_members'
  | 'update_icon'
  | 'attach_uploads'
  | 'remove_uploads'
  | 'archive'
  | 'delete'
  | 'change_state'
  | 'update_custom_field_values'
  | 'update_dates'
  | 'update_labels'
  | 'update_leaders'
  | 'attach_portfolios'
  | 'detach_portfolios';
  data: {
    // For rename
    name?: string;
    // For update_status
    status?: 'active' | 'planning' | 'completed' | 'on-hold' | 'archived';
    // For update_priority
    priority?: string;
    // For add_viewers
    viewerIds?: string[];
    // For add_members and add_user_from_team
    members?: Array<{ userId: string; role: string; teamID?: string }>;
    // For remove_members
    userIds?: string[];
    // For Add members via team
    teamId?: string;     
    // For update_icon
    iconId?: string;
    // for attach_uploads and remove_uploads
    uploadIds?: string[]
    // For change_state
    state?: string;
    // For update_custom_field_values
    customFieldValues?: Record<string, any>;
    // for update_dates
    startDate?: string;
    endDate?: string;
    // For update_labels
    labelIds?: string[];
    // For update_leaders
    leaderIds?: string[];
    // For link_portfolios
    portfolioIds?: string[];
  };
  // ✅ Root level fields to satisfy backend validation checks
  members?: Array<{ userId: string; role: string; teamId?: string }>;
  teamId?: string;
  teamIds?: string[];
}

// ✅ GET all projects
export const getAllProjects = async (): Promise<ProjectResponse[]> => {
  const response: GetAllProjectsResponse = await axiosInstance.get("/project");
  return response.projects; // ✅ Return the projects array
};

// ✅ GET single project by ID
export const getProjectById = async (projectId: string): Promise<ProjectResponse> => {
  const response = await axiosInstance.get(`/project/${projectId}`);
  return response;
};

// Existing create project
export const createProject = async (payload: {
  name: string;
  description: string;
  slug: string;
  portfolioId?: string;
  linkedPortfolios?: string[];
  leaders?: string[];
  priority?: "high" | "medium" | "low" | "critical";
  privacy?: "public" | "private";
  iconId?: string | null;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await axiosInstance.post("/project", payload);
  return response;
};

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  slug?: string;
  portfolioId?: string;
  linkedPortfolios?: string[];
  leaders?: string[];
  priority?: string;
  privacy?: 'public' | 'private';
  iconId?: string;
  startDate?: string;
  endDate?: string;
  state?: string;       // for project state
  status?: string;
}

export const updateProjectApi = async (
  projectId: string,
  payload: UpdateProjectPayload
): Promise<ProjectResponse> => {
  const response = await axiosInstance.put(`/project/${projectId}`, payload);
  return response;
};

// 8️⃣ Delete Project
export const deleteProjectApi = async (
  projectId: string
): Promise<any> => {
  const response = await axiosInstance.delete(`/project/${projectId}`);
  return response as any;
};

// 1️⃣ Rename Project
export const renameProjectPatchApi = async (
  projectId: string,
  name: string
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'rename',
    data: { name }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 2️⃣ Update Project Status
export const updateProjectStatusPatchApi = async (
  projectId: string,
  status: 'active' | 'planning' | 'completed' | 'on-hold' | 'archived'
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'update_status',
    data: { status }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 3️⃣ Update Project Priority
export const updateProjectPriorityPatchApi = async (
  projectId: string,
  priority: string
): Promise<any> => {
  const payload: PatchProjectOperation = {
    operation: 'update_priority',
    data: { priority }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 4️⃣ Add Viewers (already exists, just verify)
export const addViewersToProjectPatchApi = async (
  projectId: string,
  viewerIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'add_viewers',
    data: { viewerIds }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 5️⃣ Remove viewers from project ask kathik once
export const removeViewersFromProjectPatchApi = async (
  projectId: string,
  viewerIds: string[]
): Promise<any> => {
  const payload: PatchProjectOperation = {
    operation: 'remove_viewers',
    data: { viewerIds }
  };
  console.log("Remove Viewers Payload:", payload);
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  console.log("Remove Viewers Response:", response);
  return response;
};

// 6️⃣ Add Members
export const addMembersToProjectPatchApi = async (
  projectId: string,
  members: Array<{ userId: string; role: string }>
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'add_members',
    members, // Root level for validation
    data: { members }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// Case 2 - Add All members from a team (only teamId)
export const addMembersToProjectViaTeamPatchApi = async (
  projectId: string,
  teamId: string
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'add_members',
    teamId, // Root level for validation
    data: { teamId }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

//Case 3 - Add Specific user from a team (with teamId inside members)
export const addUserToProjectFromTeamPatchApi = async (
  projectId: string,
  members: Array<{userId: string; role: string; teamId: string}>
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'add_members',
    members, // Root level for validation
    teamId: members[0]?.teamId, // Added this to satisfy root-level validation
    data: {members}
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
}

// 7️⃣ Remove Members
export const removeMembersFromProjectPatchApi = async (
  projectId: string,
  userIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'remove_members',
    data: { userIds }
  };
  console.log("Remove Members Payload:", payload);
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  console.log("Remove Members Response:", response);
  return response;
};

// Add members via team

// 8️⃣ Update Project Icon
export const updateProjectIconPatchApi = async (
  projectId: string,
  iconId: string
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'update_icon',
    data: { iconId }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 7️⃣ Attach uploads to project
export const attachUploadsToProjectPatchApi = async (
  projectId: string,
  uploadIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'attach_uploads',
    data: { uploadIds }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 8️⃣ Remove uploads from project
export const removeUploadsFromProjectPatchApi = async (
  projectId: string,
  uploadIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'remove_uploads',
    data: { uploadIds }
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 9️⃣ Archive Project
export const archiveProjectPatchApi = async (
  projectId: string
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'archive',
    data: {}
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 10 Delete Project
export const deleteProjectPatchApi = async (
  projectId: string
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'delete',
    data: {}
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 11 Change project state
export const changeProjectPhasePatchApi = async (
  projectId: string,
  phase: string
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'change_state',
    data: { state: phase },
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
}

// 12 Update project custom field values
export const updateProjectCustomFieldValuesApi = async (
  projectId: string,
  customFieldValues: Record<string, any>
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'update_custom_field_values',
    data: { customFieldValues },
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 13 Update project startDate, enddate
export const updateProjectDatesPatchApi = async (
  projectId: string,
  startDate?: string,
  endDate?: string
): Promise<ProjectResponse> => {
  const data: { startDate?: string; endDate?: string } = {};

  if (startDate !== undefined) data.startDate = startDate;
  if (endDate !== undefined) data.endDate = endDate;

  const payload: PatchProjectOperation = {
    operation: 'update_dates',
    data,
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 14 Update project labels
export const updateProjectLabelsPatchApi = async (
  projectId: string,
  labelIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'update_labels',
    data: { labelIds },
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 15 Update project leaders
export const updateProjectLeadersPatchApi = async (
  projectId: string,
  leaderIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'update_leaders',
    data: { leaderIds },
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 16 Attach portfolios to project
export const attachPortfoliosPatchApi = async (
  projectId: string,
  portfolioIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'attach_portfolios',
    data: { portfolioIds },
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};

// 17 Detach portfolios from project
export const detachPortfoliosPatchApi = async (
  projectId: string,
  portfolioIds: string[]
): Promise<ProjectResponse> => {
  const payload: PatchProjectOperation = {
    operation: 'detach_portfolios',
    data: { portfolioIds },
  };
  const response = await axiosInstance.patch(`/project/${projectId}`, payload);
  return response;
};


export interface CustomFieldAPI {
  _id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  settings?: Record<string, any>;
}

export interface CustomFieldCreateRequest {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  settings?: Record<string, any>;
}

export interface CustomFieldsResponse {
  success: boolean;
  customFields: CustomFieldAPI[];
}

export interface CustomFieldCreateResponse {
  success: boolean;
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  settings?: Record<string, any>;
  customFields: CustomFieldAPI[];
}

// Get all custom fields for a project
export const getCustomFieldsApi = async (projectId: string): Promise<CustomFieldsResponse> => {
  const response = await axiosInstance.get<CustomFieldsResponse>(
    `/project/${projectId}/custom-fields`
  );
  return response;
};

// Create a new custom field
export const createCustomFieldApi = async (
  projectId: string,
  data: CustomFieldCreateRequest
): Promise<CustomFieldCreateResponse> => {
  const response = await axiosInstance.post<CustomFieldCreateResponse>(
    `/project/${projectId}/custom-fields`,
    data
  );
  return response;
};

// ✅ Prevent name/type from being passed at the type level
export type CustomFieldUpdateRequest = Omit<Partial<CustomFieldCreateRequest>, 'name' | 'type'>;

// Update a custom field (you may need to add this endpoint to backend)
export const updateCustomFieldApi = async (
  projectId: string,
  fieldId: string,
  data: CustomFieldUpdateRequest   // ← was: Partial<CustomFieldCreateRequest>
): Promise<CustomFieldCreateResponse> => {
  const response = await axiosInstance.put<CustomFieldCreateResponse>(
    `/project/${projectId}/custom-fields/${fieldId}`,
    data
  );
  return response;
};

// Delete a custom field (you may need to add this endpoint to backend)
export const deleteCustomFieldApi = async (
  projectId: string,
  fieldId: string
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.delete<{ success: boolean }>(
    `/project/${projectId}/custom-fields/${fieldId}`
  );
  return response;
};


// Task Type Configuration APIs
export const getTaskTypeConfigApi = async (projectId: string) => {
  const response = await axiosInstance.get(`/project/${projectId}/task-type-config`);
  return response;
};

export const createTaskTypeApi = async (projectId: string, data: {
  value: string;
  label: string;
  pluralLabel?: string;
  description: string;
  color: string;
  order: number;
  iconId?: string;
}) => {
  const response = await axiosInstance.post(`/project/${projectId}/task-type-config`, data);
  console.log('Create Task Type API response:', response);
  return response;
};

export const updateTaskTypeApi = async (projectId: string, typeId: string, data: {
  label?: string;
  pluralLabel?: string;
  description?: string;
  color?: string;
  order?: number;
  iconId?: string;
}) => {
  const response = await axiosInstance.put(`/project/${projectId}/task-type-config/${typeId}`, data);
  return response;
};

export const deleteTaskTypeApi = async (projectId: string, typeId: string) => {
  const response = await axiosInstance.delete(`/project/${projectId}/task-type-config/${typeId}`);
  return response;
};


// Task Status Config APIs
export const getTaskStatusConfigApi = async (projectId: string) => {
  const response = await axiosInstance.get(`/project/${projectId}/task-status-config/metadata`);
  return response; // returns { taskStatusConfig: [...] }
};

export const createTaskStatusApi = async (projectId: string, data: {
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
}) => {
  const response = await axiosInstance.post(`/project/${projectId}/task-status-config`, data);
  return response; // returns the created status object
};

export const updateTaskStatusApi = async (projectId: string, statusId: string, data: {
  label?: string;
  description?: string;
  color?: string;
  order?: number;
}) => {
  const response = await axiosInstance.put(`/project/${projectId}/task-status-config/${statusId}`, data);
  return response;
};

export const deleteTaskStatusApi = async (projectId: string, statusId: string) => {
  const response = await axiosInstance.delete(`/project/${projectId}/task-status-config/${statusId}`);
  return response;
};

// Project Status Config APIs
export const getProjectStatusConfigApi = async (projectId: string) => {
  const response = await axiosInstance.get(`/project/${projectId}/project-status-config`);
  return response; // returns array of status configs
};

export const createProjectStatusConfigApi = async (projectId: string, data: {
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
}) => {
  const response = await axiosInstance.post(`/project/${projectId}/project-status-config`, data);
  return response;
};

export const updateProjectStatusConfigApi = async (projectId: string, statusId: string, data: {
  label?: string;
  description?: string;
  color?: string;
  order?: number;
}) => {
  const response = await axiosInstance.put(`/project/${projectId}/project-status-config/${statusId}`, data);
  return response;
};

export const deleteProjectStatusConfigApi = async (projectId: string, statusId: string) => {
  const response = await axiosInstance.delete(`/project/${projectId}/project-status-config/${statusId}`);
  return response;
};

export const getProjectPriorityConfigApi = async (projectId: string) => {
  const data = await axiosInstance.get<{ projectPriorityConfig: ProjectPriorityConfig[] }>(
    `/project/${projectId}/project-priority-config`
  );
  return data.projectPriorityConfig ?? [];
};

export const createProjectPriorityConfigApi = async (
  projectId: string,
  payload: Omit<ProjectPriorityConfig, '_id'>
) => {
  return await axiosInstance.post<ProjectPriorityConfig>(
    `/project/${projectId}/project-priority-config`,
    payload
  );
};

export const updateProjectPriorityConfigApi = async (
  projectId: string,
  priorityId: string,
  payload: Partial<Omit<ProjectPriorityConfig, '_id'>>
) => {
  return await axiosInstance.put<ProjectPriorityConfig>(
    `/project/${projectId}/project-priority-config/${priorityId}`,
    payload
  );
};

export const deleteProjectPriorityConfigApi = async (
  projectId: string,
  priorityId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/project/${projectId}/project-priority-config/${priorityId}`
  );
};

// ── Task Priority Config ──────────────────────────────────────────
export const getTaskPriorityConfigApi = async (projectId: string) => {
  const data = await axiosInstance.get<{ taskPriorityConfig: TaskPriorityConfig[] }>(
    `/project/${projectId}/task-priority-config`
  );
  return data.taskPriorityConfig ?? [];
};

export const createTaskPriorityConfigApi = async (
  projectId: string,
  payload: Omit<TaskPriorityConfig, '_id'>
) => {
  return await axiosInstance.post<TaskPriorityConfig>(
    `/project/${projectId}/task-priority-config`,
    payload
  );
};

export const updateTaskPriorityConfigApi = async (
  projectId: string,
  priorityId: string,
  payload: Partial<Omit<TaskPriorityConfig, '_id'>>
) => {
  return await axiosInstance.put<TaskPriorityConfig>(
    `/project/${projectId}/task-priority-config/${priorityId}`,
    payload
  );
};

export const deleteTaskPriorityConfigApi = async (
  projectId: string,
  priorityId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/project/${projectId}/task-priority-config/${priorityId}`
  );
};
// ── Cycles ────────────────────────────────────────────────────────
export interface CycleConfig {
  enabled: boolean;
  coolingPeriodDays: number;
  defaultDurationDays: number;
  enforceCoolingPeriod: boolean;
  allowOverlappingCycles: boolean;
  cycleSlugPrefix: string;
  nextCycleNumber: number;
  maxCycles: number;
  onCycleClose:
    | "move_tasks_to_next_cycle"
    | "keep_tasks_in_cycle"
    | "duplicate_unfinished_tasks"
    | "archive_unfinished_tasks"
    | "close_unfinished_tasks"
    | "ask_me";
}

export interface ParallelCycleConfig extends CycleConfig {
  id: string;
  name: string;
  /** ISO date string — config start date (not end date; duration is defaultDurationDays) */
  startDate: string;
  iconId?: string;
  cycleCount: number;
}

export interface GetCycleConfigResponse {
  cycleConfigs: ParallelCycleConfig[];
  usesParallelCycleConfigs: boolean;
  currentCycleCount: number;
  numberOfCycles: number;
}

export interface Cycle {
  id: string;
  projectId: string;
  tenantId: string;
  cycleConfigId?: string;
  name: string;
  slug: string;
  cycleNumber: number;
  iconId?: string;
  description?: string;
  status: "planned" | "active" | "completed" | "archived";
  startDate: string;
  endDate: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface ListCyclesResponse {
  cycles: Cycle[];
}

export const getCycleConfigApi = async (projectId: string): Promise<GetCycleConfigResponse> => {
  return await axiosInstance.get(`/project/${projectId}/cycle-config`);
};

export const updateCycleConfigApi = async (projectId: string, payload: Partial<CycleConfig>): Promise<{ cycleConfig: CycleConfig }> => {
  return await axiosInstance.patch(`/project/${projectId}/cycle-config`, payload);
};

export const getParallelCycleConfigsApi = async (projectId: string): Promise<{ cycleConfigs: ParallelCycleConfig[]; usesParallelCycleConfigs: boolean }> => {
  return await axiosInstance.get(`/project/${projectId}/cycle-configs`);
};

export interface CreateParallelCycleConfigResponse {
  cycleConfigs: ParallelCycleConfig[];
  usesParallelCycleConfigs: boolean;
  initialCycle?: Cycle;
}

export const createParallelCycleConfigApi = async (
  projectId: string,
  payload: Partial<ParallelCycleConfig> & {
    cycleName?: string;
    description?: string;
    slug?: string;
    cycleNumber?: number;
    sortOrder?: number;
    status?: string;
    endDate?: string;
  }
): Promise<CreateParallelCycleConfigResponse> => {
  return await axiosInstance.post(`/project/${projectId}/cycle-configs`, payload);
};

export const updateParallelCycleConfigApi = async (projectId: string, cycleConfigId: string, payload: Partial<ParallelCycleConfig>): Promise<{ cycleConfig: ParallelCycleConfig }> => {
  return await axiosInstance.patch(`/project/${projectId}/cycle-configs/${cycleConfigId}`, payload);
};

export const deleteParallelCycleConfigApi = async (projectId: string, cycleConfigId: string): Promise<{ success: boolean; message: string }> => {
  return await axiosInstance.delete(`/project/${projectId}/cycle-configs/${cycleConfigId}`);
};

export const getCyclesApi = async (projectId: string, params?: { status?: string; startAfter?: string; startBefore?: string; cycleConfigId?: string }): Promise<ListCyclesResponse> => {
  return await axiosInstance.get(`/project/${projectId}/cycles`, { params });
};

export const createCycleApi = async (projectId: string, payload: Partial<Cycle>): Promise<Cycle> => {
  return await axiosInstance.post(`/project/${projectId}/cycles`, payload);
};

export const getCycleByIdApi = async (projectId: string, cycleId: string): Promise<Cycle> => {
  return await axiosInstance.get(`/project/${projectId}/cycles/${cycleId}`);
};

export const updateCycleApi = async (projectId: string, cycleId: string, payload: Partial<Cycle>): Promise<Cycle> => {
  return await axiosInstance.patch(`/project/${projectId}/cycles/${cycleId}`, payload);
};

export const deleteCycleApi = async (projectId: string, cycleId: string): Promise<{ success: boolean; message: string }> => {
  return await axiosInstance.delete(`/project/${projectId}/cycles/${cycleId}`);
};
